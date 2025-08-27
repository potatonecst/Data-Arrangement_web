import pandas as pd
import numpy as np
import io
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
        self.simpleSim = 0
        self.alpha = 0 #radian
        self.simPropDir = 1 #1 -> forward, 0 -> backward
        self.fitting = 0
        self.initialAlpha = 0 #radian
        self.resultFilename = "center_field_data.txt"
    
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
    
    def extractData(self, text: str):
        df = pd.read_csv(io.StringIO(text))
        Ey_real = df.loc[df["Component"] == "Ey", "Real_Part"].iloc[0]
        Ey_imag = df.loc[df["Component"] == "Ey", "Imaginary_Part"].iloc[0]
        Ez_real = df.loc[df["Component"] == "Ez", "Real_Part"].iloc[0]
        Ez_imag = df.loc[df["Component"] == "Ez", "Imaginary_Part"].iloc[0]
        self.Ey = np.conjugate(Ey_real + 1j * Ey_imag) #phase convention: e^i(kz-wt) -> e^i(wt-kz) [complex conjugate]
        self.Ez = np.conjugate(Ez_real + 1j * Ez_imag)
    
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
        self.s1FDTD, self.s2FDTD, self.s3FDTD, self.IFDTD = self.calcState(self.Ey, self.Ez)
        
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
        
