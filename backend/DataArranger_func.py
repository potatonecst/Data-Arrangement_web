import numpy as np
from scipy.optimize import curve_fit
from HybridModeSolverRevised import CalcHEMode
from PolarizationCalculationRevised import CalcPolarizationFDTD

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
        self.a = 200e-9 #fiber radius
        self.nco = 1.45
        self.ncl = 1.0
        self.n = 1
        self.l = 1
        self.lam = 785e-9 #wavelength
        self.psi = np.pi / 2 #quasi-y
        self.R = self.a
        self.theta = np.linspace(0, 2 * np.pi, 1000)
        self.faxis = 0
        self.sigmaX = np.array([[0, 1], #Pauli行列
                                [1, 0]])
        self.sigmaY = np.array([[0, -1j],
                                [1j, 0]])
        self.sigmaZ = np.array([[1, 0],
                                [0, -1]])
        self.divNo = 201 #分割数
        self.simpleSim = 0
        self.alpha = 0 #radian
        self.simPropDir = 1 #1 -> forward, 0 -> backward
        self.fitting = 0
        self.initialAlpha = 0 #radian
        self.Es_real_name = "Es_real.txt" #for display default filename
        self.Es_imag_name = "Es_imag.txt"
        self.Ep_real_name = "Ep_real.txt"
        self.Ep_imag_name = "Ep_imag.txt"
    
    def setDivisionNo(self, divNo): #Settings項目
        self.divNo = divNo
    
    def setSimpleSim(self, simpleSim):
        self.simpleSim = simpleSim
    
    def setAlpha(self, alpha):
        self.alpha = alpha
    
    def setSimPropDir(self, simPropDir):
        self.simPropDir = simPropDir
    
    def setInitialAlpha(self, initialAlpha):
        self.initialAlpha = initialAlpha
    
    def setFiberRadius(self, a):
        self.a = a * 1e-9 #a [nm]
        self.R = self.a
    
    def setWavelength(self, lam):
        self.lam = lam * 1e-9 #lam [nm]
    
    def setInitialPol(self, psi):
        self.psi = np.pi / 2 if psi == 0 else 0 #psi: 0 -> np.pi / 2, 1 -> 0
    
    def inputData(self, EsReal_txt: str, EsImag_txt: str, EpReal_txt: str, EpImag_txt: str):
        #1行ずつlistに格納(\nは削除)
        self.EsFile_real = EsReal_txt.splitlines()
        self.EsFile_imag = EsImag_txt.splitlines()
        self.EpFile_real = EpReal_txt.splitlines()
        self.EpFile_imag = EpImag_txt.splitlines()
    
    def extractData(self):
        self.uz = np.array(str2Float(self.EpFile_real[3:3 + self.divNo]))
        self.uy = np.array(str2Float(self.EpFile_real[5 + self.divNo:5 + 2 * self.divNo]))
        self.xp = self.uy #モニターを通過した光が進む方向をr(z)とする座標系のx座標配列
        self.yp = - self.uz #同じくy座標配列
        self.xpMesh, self.ypMesh = np.meshgrid(self.xp, self.yp) #上記の配列から(x, y)座標の組を生成
        with np.errstate(invalid="ignore"):
            self.zpMesh = np.sqrt(1 - self.xpMesh ** 2 - self.ypMesh ** 2) #z座標を計算(半径1の球の外側ではnanになる)
        
        self.Theta = np.arctan2(np.sqrt(self.xpMesh ** 2 + self.ypMesh ** 2), self.zpMesh) 
        self.Phi = np.arctan2(self.ypMesh, self.xpMesh) #arctan(self.yp / self.xp)で、self.xpとself.ypが同時に0になる時、0を返す
        print(self.Theta, self.Phi)
        
        self.Es_real = np.array(str2FloatArr(divideStr(self.EsFile_real[7 + 2 * self.divNo:7 + 3 * self.divNo])))
        self.Es_imag = np.array(str2FloatArr(divideStr(self.EsFile_imag[7 + 2 * self.divNo:7 + 3 * self.divNo])))
        self.Es = np.array(self.Es_real + 1j * self.Es_imag).T[::-1, :]
        
        self.Ep_real = np.array(str2FloatArr(divideStr(self.EpFile_real[7 + 2 * self.divNo:7 + 3 * self.divNo])))
        self.Ep_imag = np.array(str2FloatArr(divideStr(self.EpFile_imag[7 + 2 * self.divNo:7 + 3 * self.divNo])))
        self.Ep = np.array(self.Ep_real + 1j * self.Ep_imag).T[::-1, :]
    
    def calcState(self, Ey, Ez):
        pureState = np.array([[Ez], 
                              [Ey]]) #純粋状態
        rho = pureState @ pureState.conj().T #純粋状態の密度行列
        S0 = np.trace(rho @ np.identity(2)).real #Stokesパラメータ
        s1 = (np.trace(rho @ self.sigmaZ) / S0).real
        s2 = (np.trace(rho @ self.sigmaX) / S0).real
        s3 = (np.trace(rho @ self.sigmaY) / S0).real
        I = CalcPolarizationFDTD(Ey, Ez, self.theta, self.faxis).squeeze() #QWPを通過した光の強度
        
        return s1, s2, s3, I    
    
    def calcPolarization(self):
        self.ind = int(np.ceil(self.divNo / 2)) if self.divNo % 2 == 0 else int(np.ceil(self.divNo / 2)) - 1 #原点あるいは原点に最も近い正の点を示すindex
        print(self.ind, self.uz[self.ind])
        self.EsPP = self.Es[self.ind, self.ind]
        self.EpPP = self.Ep[self.ind, self.ind]
        print(f"Es: {self.EsPP}, Ep: {self.EpPP}")
        #self.EyPP = self.EpPP * np.cos(self.Theta[self.ind, self.ind]) * np.cos(self.Phi[self.ind, self.ind]) - self.EsPP * np.sin(self.Phi[self.ind, self.ind])
        #self.EzPP = (self.EpPP * np.cos(self.Theta[self.ind, self.ind]) * np.sin(self.Phi[self.ind, self.ind]) + self.EsPP * np.cos(self.Phi[self.ind, self.ind]))
        self.EyPP = -self.EpPP
        self.EzPP = -self.EsPP
        self.s1FDTD, self.s2FDTD, self.s3FDTD, self.IFDTD = self.calcState(self.EyPP, self.EzPP)
        
        return self.s1FDTD, self.s2FDTD, self.s3FDTD, self.theta, self.IFDTD
    
    def simpleSimulations(self, alpha):
        print(alpha)
        ExSim, EySim, EzSim = CalcHEMode(self.a, self.nco, self.ncl, self.n, self.l, self.lam, self.psi, self.R, alpha, self.simPropDir)
        print(f"ExSim: {ExSim}, EySim: {EySim}, EzSim: {EzSim}")
        s1Sim, s2Sim, s3Sim, ISim = self.calcState(EySim, EzSim)
        #print(f"ISim: {self.ISim}")
        
        return s1Sim, s2Sim, s3Sim, self.theta, ISim
    
    def simulationModelForFitting(self, theta, alpha):
        _, EySim, EzSim = CalcHEMode(self.a, self.nco, self.ncl, self.n, self.l, self.lam, self.psi, self.R, alpha, self.simPropDir) #alpha: deg
        _, _, _, ISim = self.calcState(EySim, EzSim)
        return ISim
    
    def findBestFit(self):
        targetIntensity = self.IFDTD
        popt, pcov = curve_fit(self.simulationModelForFitting, self.theta, targetIntensity, p0=[self.initialAlpha], bounds=(-np.pi / 2, np.pi / 2))
        bestAlpha = np.rad2deg(popt[0]) #bestAlpha: rad -> deg
        return bestAlpha
        
