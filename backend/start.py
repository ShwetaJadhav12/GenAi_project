"""
Startup wrapper — sets critical environment variables BEFORE any imports,
then launches uvicorn programmatically.

Run with:  python start.py
"""
import os

# Must be set before numpy/scipy/sklearn are imported anywhere.
# Prevents OpenBLAS memory allocation crashes on Windows with Python 3.14.
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_MAIN_FREE"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_excludes=["*.db", "test_*.py", "test_result*.txt"],
    )
