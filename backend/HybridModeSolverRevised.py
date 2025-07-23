import numpy as np
from scipy.special import jn, kn, jvp, kvp
from scipy.optimize import root_scalar

def HybridModeEigenvalueEqSolver(V, n, l, nco, ncl):
    def HybridModeEigenvalueEq(Us): #ハイブリッドモードの固有値方程式(=0の形)
        Ws = np.sqrt(V ** 2 - Us ** 2) #Wパラメータ
        
        with np.errstate(invalid="ignore"):
            NumerL1 = Ws * kn(n, Ws) * jvp(n, Us, 1) + Us * jn(n, Us) * kvp(n, Ws, 1) #左辺分子1
            NumerL2 = Ws * kn(n, Ws) * jvp(n, Us) + (ncl / nco) ** 2 * Us * jn(n, Us) * kvp(n, Ws, 1) #左辺分子2
            DenomL = Us * Ws * jn(n, Us) * kn(n, Ws) #左辺分母
            
            NumerR1 = n ** 2 * (Ws ** 2 + Us ** 2) #右辺分子1
            NumerR2 = Ws ** 2 + (ncl / nco) ** 2 * Us ** 2 #右辺分子2
            DenomR = Us ** 2 * Ws ** 2 #右辺分母
        
        return DenomR ** 2 * NumerL1 * NumerL2 - DenomL ** 2 * NumerR1 * NumerR2
    
    U = np.linspace(0, V, 10000) #Uパラメータ
    eigenvalueArr = HybridModeEigenvalueEq(U) #固有値方程式配列
    signChangeInd, = np.nonzero(eigenvalueArr[:-1] * eigenvalueArr[1:] < 0) #符号変化のインデックス
    
    zeroUArr = []
    for ind in signChangeInd:
        bracket = [U[ind], U[ind + 1]] #解がある範囲（この間で符号が変化）
        solution = root_scalar(HybridModeEigenvalueEq, bracket=bracket, method="brentq") #解を求める
        if solution.converged: #解が見つかったか確認
            zeroUArr.append(solution.root) #zeroUArrに解を追加
    
    Usol = zeroUArr[l - 1] if len(zeroUArr) >= l else V #l番目の解を取り出す
    if Usol == V:
        print("WARNING: No solution found.")
    
    return Usol

# Eモードの電場計算
def CalcHEMode(a, nco, ncl, n, l, lam, psi, R, T, propDir):
    k = 2 * np.pi / lam
    
    V = k * a * np.sqrt(nco**2 - ncl**2) #規格化周波数V
    
    U = HybridModeEigenvalueEqSolver(V, n, l, nco, ncl) #固有値Uを求める
    if U is None:
        print(f"Error: No solution found for mode (n={n}, l={l}).")
        return None, None, None
    
    beta = np.sqrt(k**2 * nco**2 - (U / a)**2) if propDir == True else - np.sqrt(k**2 * nco**2 - (U / a)**2) #伝播定数β
    W = np.sqrt(V**2 - U**2)
    
    s = n * (1/(U**2) + 1/(W**2)) / (jvp(n,U, 1)/(U * jn(n,U)) + kvp(n,W, 1)/(W * kn(n,W))) #電場分布の補正係数
    
    #電場分布
    Er = np.where(
        R < a,
        -1j * beta * (a / U) * ((1 - s) / 2 * jn(n-1, U / a * R) - (1 + s) / 2 * jn(n+1, U / a * R)) * np.cos(n * T + psi),
        -1j * beta * (a * jn(n, U)) / (W * kn(n, W)) * ((1 - s) / 2 * kn(n - 1, W / a * R) + (1 + s) / 2 * kn(n + 1, W / a * R)) * np.cos(n * T + psi)
    )
    
    Et = np.where(
        R < a,
        1j * beta * (a / U) * ((1 - s) / 2 * jn(n-1, U / a * R) + (1 + s) / 2 * jn(n+1, U / a * R)) * np.sin(n * T + psi),
        1j * beta * (a * jn(n, U)) / (W * kn(n, W)) * ((1 - s) / 2 * kn(n - 1, W / a * R) - (1 + s) / 2 * kn(n + 1, W / a * R)) * np.sin(n * T + psi)
    )
    
    Ez = np.where(
        R < a,
        jn(n, U / a * R) * np.cos(n * T + psi),
        (jn(n, U) / kn(n, W)) * kn(n, W / a * R) * np.cos(n * T + psi)
    )
    
    Ex = Er * np.cos(T) - Et * np.sin(T)
    Ey = Er * np.sin(T) + Et * np.cos(T)
    
    return Ex, Ey, Ez


#例:
if __name__ == "__main__":
    a = 200e-9  #fiber radius
    nco = 1.45  #Core refractive index
    ncl = 1.00  #Cladding refractive index
    n = 1    #Mode number
    l = 1    #Order of the mode
    lam = 785e-9 #wavelength
    psi = np.pi/2.0 #phase of quasi-y pol.
    R = a   #radial distance
    alpha = 0.8 * np.pi/2.  #angle <T in the function>
    propDir = 0 #propagation direction: 0 -> plus z-dir, 1 -> minus z-dir
    
    E = np.array(CalcHEMode(a, nco, ncl, n, l, lam, psi, R, alpha, propDir))
    print(E)