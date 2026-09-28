# Bitcoin Cryptocurrency Market

This solution notebook analyzes the daily cryptocurrency CSV files bundled in `challenges/cryptoanalisis/crypto.zip`. It loads the archive in place, so the source data stays unchanged.

## Run

Create a project virtual environment and install the notebook dependencies into it.

On Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On Git Bash:

```sh
py -m venv .venv
source .venv/Scripts/activate
python -m pip install -r requirements.txt
```

Select the `.venv` Python interpreter/kernel in VS Code, open `Bitcoin Cryptocurrency Market.ipynb`, and run all cells. The notebook finds the archive from either the repository root or this solution directory.

The data is historical and ends in 2021. Volatility, correlation, seasonality, and the baseline forecast are descriptive learning exercises, not reliable investment predictions or financial advice.
