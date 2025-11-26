from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import requests
import os
from typing import Optional

AUTH_0_DOMAIN = os.getenv("AUTH_0_DOMAIN")
API_AUDIENCE = os.getenv("AUTH_0_AUDIENCE")
ALGORITHMS = ["RS256"]
auth_scheme = HTTPBearer()


def get_current_user(token: str = Depends(auth_scheme)):
    try:
        jwks_url = f"https://{AUTH_0_DOMAIN}/.well-known/jwks.json"
        jwks = requests.get(jwks_url).json()
        unverified_header = jwt.get_unverified_header(token.credentials)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token")
        payload = jwt.decode(token.credentials, rsa_key, algorithms=ALGORITHMS,
                             audience=API_AUDIENCE, issuer=f"https://{AUTH_0_DOMAIN}/")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token Validation Failed")


def get_current_user_optional(token: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if token is None:
        return None
    try:
        jwks_url = f"https://{AUTH_0_DOMAIN}/.well-known/jwks.json"
        jwks = requests.get(jwks_url).json()
        unverified_header = jwt.get_unverified_header(token.credentials)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if not rsa_key:
            return None
        payload = jwt.decode(token.credentials, rsa_key, algorithms=ALGORITHMS,
                             audience=API_AUDIENCE, issuer=f"https://{AUTH_0_DOMAIN}/")
        return payload
    except Exception:
        return None
