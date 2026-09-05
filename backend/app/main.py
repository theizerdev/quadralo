from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.api.v1 import auth, investments, bcv, sales
from app.models import user, investment, bcv as bcv_model, sale

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(investments.router, prefix=f"{settings.API_V1_STR}/investments", tags=["investments"])
app.include_router(sales.router, prefix=f"{settings.API_V1_STR}/sales", tags=["sales"])
app.include_router(bcv.router, prefix=f"{settings.API_V1_STR}/bcv", tags=["bcv"])

@app.get("/")
def root():
    return {"message": "Bienvenido a ADATOV SaaS API", "status": "online"}
