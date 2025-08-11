import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import numpy as np

from DataArranger_func import Arranger

class ArrangementSettings(BaseModel):
    divNo: int
    EsRealName: str
    EsImagName: str
    EpRealName: str
    EpImagName: str
    simpleSim: bool
    alpha: float
    fitting: bool
    initialAlpha: float

class CalculationRequest(BaseModel):
    divNo: int
    EsRealContent: str
    EsImagContent: str
    EpRealContent: str
    EpImagContent: str
    simpleSim: bool
    alpha: float
    fitting: bool
    initialAlpha: float

class FDTDResult(BaseModel):
    s1: float
    s2: float
    s3: float
    theta: List[float]
    alpha: None
    intensity: List[float]

class SimpleSimResult(BaseModel):
    s1: float
    s2: float
    s3: float
    theta: List[float]
    alpha: float
    intensity: List[float]

class FittingResult(BaseModel):
    s1: float
    s2: float
    s3: float
    theta: List[float]
    alpha: float
    intensity: List[float]

class CalculationRespose(BaseModel):
    fdtd: FDTDResult
    simpleSim: Optional[SimpleSimResult] = None
    fitting: Optional[FittingResult] = None

load_dotenv()

app = FastAPI()

origins = os.getenv("CORS_ORIGINS", "").split(",")

if not origins or origins == [""]:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

print(f"Allowed origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("--- 422 Validation Error Details ---")
    # エラーの詳細内容（exc.errors()）を、見やすく整形してコンソールに出力
    print(json.dumps(exc.errors(), indent=2))
    print("------------------------------------")
    
    # フロントエンドには通常通りの422エラーを返す
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

@app.get("/default-values")
def get_default_values():
    arranger = Arranger()
    return {
        "divNo": arranger.divNo,
        "EsRealName": arranger.Es_real_name,
        "EsImagName": arranger.Es_imag_name,
        "EpRealName": arranger.Ep_real_name,
        "EpImagName": arranger.Ep_imag_name,
        "simpleSim": arranger.simpleSim,
        "alpha": arranger.alpha,
        "fitting": arranger.fitting,
        "initialAlpha": arranger.initialAlpha,
    }

@app.post("/calculate", response_model=CalculationRespose)
def run_calculate(request: CalculationRequest):
    arranger = Arranger()
    arranger.setDivisionNo(request.divNo)
    arranger.inputData(request.EsRealContent, request.EsImagContent, request.EpRealContent, request.EpImagContent)
    arranger.setSimpleSim(request.simpleSim)
    arranger.setAlpha(request.alpha)
    arranger.extractData()
    
    s1F, s2F, s3F, thetaF, iF = arranger.calcPolarization()
    fdtdResult = FDTDResult(
        s1=s1F, s2=s2F, s3=s3F, theta=np.rad2deg(thetaF).tolist(), alpha=None, intensity=iF.tolist()
    )
    
    simpleSimResult = None
    if request.simpleSim:
        s1S, s2S, s3S, thetaS, iS = arranger.simpleSimulations(request.alpha)
        simpleSimResult = SimpleSimResult(
            s1=s1S, s2=s2S, s3=s3S, theta=np.rad2deg(thetaS).tolist(), alpha=request.alpha, intensity=iS.tolist()
        )
    
    fittingResult = None
    if request.fitting:
        bestAlpha = arranger.findBestFit(request.initialAlpha)
        s1Fit, s2Fit, s3Fit, thetaFit, iFit = arranger.simpleSimulations(bestAlpha)
        fittingResult = FittingResult(
            s1=s1Fit, s2=s2Fit, s3=s3Fit, theta=np.rad2deg(thetaFit).tolist(), alpha=bestAlpha, intensity=iFit.tolist()
        )
        
    
    return CalculationRespose(fdtd=fdtdResult, simpleSim=simpleSimResult, fitting=fittingResult)