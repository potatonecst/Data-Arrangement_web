import numpy as np
#import matplotlib.pyplot as plt
from HybridModeSolverRevised import CalcHEMode
from PolarizationCalculationRevised import CalcPolarizationFDTD

class fileReading:
    def __init__(self, filePath): #初期化
        self.fPath = filePath
        self.readAll()
        
    def readAll(self): #1行ずつ読み込んでlistに格納(\nは削除)
        with open(self.fPath, "r", encoding="utf-8") as f:
            self.lines = [line.strip() for line in f.readlines()]
        return self.lines
    
    def readBetween(self, startLine, endLine): #1行目は1として指定、endLineは含まない
        return self.lines[startLine - 1:endLine-1]

def divideStr(arr): #スペースで文字列を分割
    arr = [line.split() for line in arr]
    return arr

def str2Float(arr): #文字列のlistをfloat型に
    arr = [float(s) for s in arr]
    return arr

def str2FloatArr(arr): #文字列の2重listをfloat型に
    arr = [[float(s) for s in row] for row in arr] #2重リスト(arr)の0軸の要素(1重リスト)でrowをループさせ、その中でrowの要素数でループ
    return arr

class Arranger:
    def __init__(self):
        self.a = 200e-9
        self.nco = 1.45
        self.ncl = 1.0
        self.n = 1
        self.l = 1
        self.lam = 785e-9
        self.psi = np.pi / 2
        self.R = self.a
        self.theta = np.linspace(0, 2 * np.pi, 1000)
        self.faxis = 0
        self.sigmaX = np.array([[0, 1], #Pauli行列
                                [1, 0]])
        self.sigmaY = np.array([[0, -1j],
                                [1j, 0]])
        self.sigmaZ = np.array([[1, 0],
                                [0, -1]])
        self.divNo = 201
        self.simpleSim = 0
        self.alpha = 0
        self.monitorSide = 1 #1 -> opposite, 0 -> same
        self.Es_real_name = "Es_real.txt"
        self.Es_imag_name = "Es_imag.txt"
        self.Ep_real_name = "Ep_real.txt"
        self.Ep_imag_name = "Ep_imag.txt"
    
    def setFolderPath(self, folderPath):
        self.folderPath = folderPath

    def setDivisionNo(self, divNo): #settings項目
        self.divNo = divNo
    
    def setSimpleSim(self, simpleSim):
        self.simpleSim = simpleSim
    
    def setAlpha(self, alpha):
        self.alpha = alpha
    
    def setMonitorSide(self, monitorSide):
        self.monitorSide = monitorSide

    def setFileName(self, fileName, EComponentVar): #settings項目
        if EComponentVar == "EsReal":
            self.Es_real_name = fileName
        elif EComponentVar == "EsImag":
            self.Es_imag_name = fileName
        elif EComponentVar == "EpReal":
            self.Ep_real_name = fileName
        else:
            self.Ep_imag_name = fileName

    def fileInput(self):
        self.EsFile_real = fileReading(self.folderPath + "/" + self.Es_real_name)
        self.EsFile_imag = fileReading(self.folderPath + "/" + self.Es_imag_name)
        self.EpFile_real = fileReading(self.folderPath + "/" + self.Ep_real_name)
        self.EpFile_imag = fileReading(self.folderPath + "/" + self.Ep_imag_name)
    
    def extractData(self):
        self.uz = np.array(str2Float(self.EpFile_real.readBetween(4, 4 + self.divNo)))
        self.uy = np.array(str2Float(self.EpFile_real.readBetween(6 + self.divNo, 6 + 2 * self.divNo)))
        self.xp = self.uy #モニターを通過した光が進む方向をr(z)とする座標系のx座標配列
        self.yp = - self.uz #同じくy座標配列
        self.xpMesh, self.ypMesh = np.meshgrid(self.xp, self.yp) #上記の配列から(x, y)座標の組を生成
        with np.errstate(invalid="ignore"):
            self.zpMesh = np.sqrt(1 - self.xpMesh ** 2 - self.ypMesh ** 2) #z座標を計算(半径1の球の外側ではnanになる)
        
        self.Theta = np.arctan2(np.sqrt(self.xpMesh ** 2 + self.ypMesh ** 2), self.zpMesh) 
        self.Phi = np.arctan2(self.ypMesh, self.xpMesh) #arctan(self.yp / self.xp)で、self.xpとself.ypが同時に0になる時、0を返す
        print(self.Theta, self.Phi)
        
        self.Es_real = np.array(str2FloatArr(divideStr(self.EsFile_real.readBetween(8 + 2 * self.divNo, 8 + 3 * self.divNo))))
        self.Es_imag = np.array(str2FloatArr(divideStr(self.EsFile_imag.readBetween(8 + 2 * self.divNo, 8 + 3 * self.divNo))))
        self.Es = np.array(self.Es_real + 1j * self.Es_imag).T[::-1, :]
        
        self.Ep_real = np.array(str2FloatArr(divideStr(self.EpFile_real.readBetween(8 + 2 * self.divNo, 8 + 3 * self.divNo))))
        self.Ep_imag = np.array(str2FloatArr(divideStr(self.EpFile_imag.readBetween(8 + 2 * self.divNo, 8 + 3 * self.divNo))))
        self.Ep = np.array(self.Ep_real + 1j * self.Ep_imag).T[::-1, :]
    
    def calcState(self, Ey, Ez):
        self.pureState = np.array([[Ez], 
                                   [Ey]]) #純粋状態
        self.rho = self.pureState @ self.pureState.conj().T #純粋状態の密度行列
        self.S0 = np.trace(self.rho @ np.identity(2)).real #Stokesパラメータ
        self.s1 = (np.trace(self.rho @ self.sigmaZ) / self.S0).real
        self.s2 = (np.trace(self.rho @ self.sigmaX) / self.S0).real
        self.s3 = (np.trace(self.rho @ self.sigmaY) / self.S0).real
        self.I = CalcPolarizationFDTD(Ey, Ez, self.theta, self.faxis).squeeze() #QWPを通過した光の強度
        
        return self.s1, self.s2, self.s3, self.I    
    
    def calcPolarization(self):
        self.ind = int(np.ceil(self.divNo / 2)) if self.divNo % 2 == 0 else int(np.ceil(self.divNo / 2)) - 1 #原点あるいは原点に最も近い正の点を示すindex
        print(self.ind, self.uz[self.ind])
        self.EsPP = self.Es[self.ind, self.ind]
        self.EpPP = self.Ep[self.ind, self.ind]
        print(f"Es: {self.EsPP}, Ep: {self.EpPP}")
        self.EyPP = self.EpPP * np.cos(self.Theta[self.ind, self.ind]) * np.cos(self.Phi[self.ind, self.ind]) - self.EsPP * np.sin(self.Phi[self.ind, self.ind])
        self.EzPP = - (self.EpPP * np.cos(self.Theta[self.ind, self.ind]) * np.sin(self.Phi[self.ind, self.ind]) + self.EsPP * np.cos(self.Phi[self.ind, self.ind]))
        self.s1FDTD, self.s2FDTD, self.s3FDTD, self.IFDTD = self.calcState(self.EyPP, self.EzPP)
        
        return self.s1FDTD, self.s2FDTD, self.s3FDTD, self.theta, self.IFDTD
    
    def simpleSimulations(self):
        #propDir = not self.monitorSide により、sameの場合はpropDirが反転する
        self.ExSim, self.EySim, self.EzSim = CalcHEMode(self.a, self.nco, self.ncl, self.n, self.l, self.lam, self.psi, self.R, np.deg2rad(self.alpha), not self.monitorSide)
        self.s1Sim, self.s2Sim, self.s3Sim, self.ISim = self.calcState(self.EySim, self.EzSim)
        
        return self.s1Sim, self.s2Sim, self.s3Sim, self.theta, self.ISim