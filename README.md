
# IPL Analytics

An IPL cricket analytics web application built with Python and Flask. The project processes player and match-level data to explore individual performance, compare players, and analyze team contributions across seasons.

## Features

- **Player Reports:** Explore player statistics and performance across IPL seasons.
- **Player Comparison:** Compare two players using batting and bowling metrics.
- **Season Progression:** Examine match-by-match performance within a season and index trends across seasons.
- **Batting Index:** Evaluate batting performance using multiple weighted metrics.
- **Bowling Index:** Evaluate bowling performance using multiple weighted metrics.
- **Team Analytics:** Explore team statistics and player contributions.
- **Interactive Dashboards:** View cricket statistics through browser-based dashboards and charts.

## Technology Stack

- Python
- Flask
- HTML and CSS
- JavaScript
- JSON datasets

## Project Structure

```text
IPL-Analytics/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── data/
│   ├── raw_data/
│   └── processed/
├── scripts/
├── static/
│   ├── css/
│   └── js/
└── templates/
```

## Performance Indices

The project uses weighted, percentile-based metrics to evaluate player performance.

### Batting Index

| Metric | Weight |
|---|---:|
| Batting Average | 20% |
| Strike Rate | 25% |
| Team-Run Contribution | 25% |
| Dot-Ball Control | 20% |
| Boundary Rate | 10% |

### Bowling Index

| Metric | Weight |
|---|---:|
| Bowling Average | 15% |
| Bowling Strike Rate | 15% |
| Economy Rate | 30% |
| Team-Wicket Contribution | 20% |
| Dot-Ball Percentage | 20% |

The indices combine percentile scores for qualified players within each season. Qualification thresholds are applied before the index is calculated.

## Getting Started

### 1. Install Python

Install a compatible Python 3 version.

### 2. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

Replace the repository URL and directory name with your actual GitHub repository details.

### 3. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the application

```bash
python app.py
```

Open the local address shown in the terminal, typically:

http://127.0.0.1:5000


## Data Sources and Processing

This project uses ball-by-ball IPL match data from [Cricsheet](https://cricsheet.org/downloads/).

### Raw Data
A small selection of original match JSON files is included as sample data to demonstrate the source format. The complete raw dataset is available from Cricsheet's official download page.

### Processed Data
The `data/processed/` directory contains the datasets used by the application, including:

- Player and player-mapping data
- Seasonal batting and bowling statistics
- Batting and Bowling Index datasets
- Match-level player statistics
- Team statistics and contribution metrics

These datasets are used by the Flask application to power player reports, comparisons, performance charts, and team analytics.

### Reproducibility and Attribution
The processed datasets are provided so that the application can use the prepared data without requiring users to process every raw match file first.

Raw data source: [Cricsheet Downloads](https://cricsheet.org/downloads/).

Cricsheet data is provided under the Open Data Commons Attribution License. Please consult the [Cricsheet licensing information](https://cricsheet.org/about/) and comply with the applicable attribution requirements when redistributing the data.

## License

A license has not yet been specified. Add an appropriate license before presenting the project as open source.
