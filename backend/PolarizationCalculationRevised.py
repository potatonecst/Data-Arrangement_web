import numpy as np
#import matplotlib.pyplot as plt
from HybridModeSolverRevised import CalcHEMode

def RotationMatrix2D(theta):
    RTheta = np.array([[np.sin(theta), -np.cos(theta)], 
                       [np.cos(theta), np.sin(theta)]])
    return RTheta

#ThetaArrayが配列かどうかに関わらず使える
def RotateMatrix2D(M, ThetaArray):
    #(2, 2)回転行列を角度ごとに0軸方向に配置、ThetaArrayが配列でない場合のためにsqueezeを適用
    RThetaArray = np.squeeze(RotationMatrix2D(np.atleast_1d(ThetaArray)).transpose(2, 0, 1))
    MThetaArray = RThetaArray @ M @ np.linalg.inv(RThetaArray) #Mは自動で次元を拡張
    return MThetaArray

def CalcPolarization(a, nco, ncl, lam, n, l, psi, R, alpha, theta, faxis, propDir):
    #(3, len(alpha))の2次元配列に、外部ファイルを用いたHEモードの計算結果を代入
    EScat = np.array(CalcHEMode(a, nco, ncl, n, l, lam, psi, R, np.atleast_1d(alpha), propDir)) #散乱光の電場

    #----Jones matrices----
    """EScatからEzとEyを抜き出して(2, len(alpha))の配列を作成し、
    transposeで軸を入れ替えた後newaxisで次元を追加(列ベクトル化)"""
    EInJV = np.stack([EScat[2, :], EScat[1, :]]).transpose()[:, np.newaxis, ..., np.newaxis] #入射電場のJones Vector

    qwpZJM = np.array([[1, 0], 
                       [0, 1j]]) #Jones matrix of qwp (z-axis: fast)
    qwpYJM = np.array([[1, 0],
                       [0, -1j]]) #Jones matrix of qwp (y-axis: fast)

    if faxis == 0:
        qwpJM = qwpYJM #fast軸の設定(qwpYJM -> y軸)
    else:
        qwpJM = qwpZJM #fast軸の設定(qwpZJM -> z軸)

    #QWPを回転させた場合の行列を1軸方向に重ね、0軸はサイズ1(0軸はalphaの分 -> ブロードキャストさせる)
    qwpJMTheta = np.array(RotateMatrix2D(qwpJM, theta))[np.newaxis, ...] #回転したJones Matrix
    EOutJV = qwpJMTheta @ EInJV #qwp通過後のJones Vector
    #----End Jones matrices----

    #EOutJVのEyだけを取り出し、絶対値の2乗を(len(alpha), len(theta))の2次元配列Iに代入
    #I = np.square(np.delete(EOutJV, 0, axis=2).squeeze(axis=(2, 3)).real) #Ez -> 1, Ey -> 0
    I = np.square(np.delete(EOutJV, 0, axis=2).squeeze(axis=(2, 3)).__abs__()) 
    I /= np.max(I, axis=1)[..., np.newaxis] #normalize

    return I

def CalcPolarizationFDTD(Ey, Ez, theta, faxis):
    #(3, len(alpha))の2次元配列に、外部ファイルを用いたHEモードの計算結果を代入
    EScat = np.array([[Ez], [Ey]]) #散乱光の電場

    #----Jones matrices----
    """EScatをtransposeで軸を入れ替えた後newaxisで次元を追加(列ベクトル化)"""
    EInJV = EScat.transpose()[:, np.newaxis, ..., np.newaxis] #入射電場のJones Vector

    qwpZJM = np.array([[1, 0], 
                       [0, 1j]]) #Jones matrix of qwp (z-axis: fast)
    qwpYJM = np.array([[1, 0],
                       [0, -1j]]) #Jones matrix of qwp (y-axis: fast)

    if faxis == 0:
        qwpJM = qwpYJM #fast軸の設定(qwpYJM -> y軸)
    else:
        qwpJM = qwpZJM #fast軸の設定(qwpZJM -> z軸)

    #QWPを回転させた場合の行列を1軸方向に重ね、0軸はサイズ1(0軸はalphaの分 -> ブロードキャストさせる)
    qwpJMTheta = np.array(RotateMatrix2D(qwpJM, theta))[np.newaxis, ...] #回転したJones Matrix
    EOutJV = qwpJMTheta @ EInJV #qwp通過後のJones Vector
    #----End Jones matrices----

    #EOutJVのEyだけを取り出し、実部の2乗を(len(alpha), len(theta))の2次元配列Iに代入
    #I = np.square(np.delete(EOutJV, 0, axis=2).squeeze(axis=(2, 3)).real) #Ez -> 1, Ey -> 0
    I = np.square(np.delete(EOutJV, 0, axis=2).squeeze(axis=(2, 3)).__abs__()) 
    I /= np.max(I, axis=1)[..., np.newaxis] #normalize

    return I

#Example
if __name__ == "__main__":
    import matplotlib.pyplot as plt
    #----Initial Conditions----
    a = (200)*1e-9 #Fiber Radius
    nco = 1.45 #Silica
    ncl = 1.0 #Vacuum
    lam = 785e-9 #Wavelength
    #---- End Initial Conditions----

    #----Mode Parameters----
    n = 1
    l = 1
    psi = np.pi/2. #x-pol -> 0, y-pol -> pi/2
    #---- End Mode Parameters----

    #----Calculate Conditions----
    R = a #distance from z-axis to calculation point
    #alpha = np.linspace(-np.pi/2., np.pi/2., 7) #angle of particle
    alpha = np.pi/2.
    theta = np.linspace(0.0, 2*np.pi, 1000) #angle of QWP
    faxis = 0 #fast axis -> y
    propDir = 0 #propagation direction: 0 -> plus z-dir, 1 -> minus z-dir
    #----End Calculate Conditions----

    I = CalcPolarization(a, nco, ncl, lam, n, l, psi, R, alpha, theta, faxis, propDir)

    fig, ax = plt.subplots(1, 1)
    fig.set_figwidth(8)
    fig.set_figheight(6)
    for i in range(len(np.atleast_1d(alpha))):
        ax.plot(np.rad2deg(theta), I[i], ls="-.", lw=1, label=f"alpha={np.rad2deg(np.atleast_1d(alpha)[i]):.2f}°")
    ax.set_xlabel("Angle of QWP [deg.]")
    ax.set_ylabel("Intensity [arb. units]")
    ax.legend(bbox_to_anchor=(1, 0.5), loc="center left")
    fig.tight_layout()

    plt.show()