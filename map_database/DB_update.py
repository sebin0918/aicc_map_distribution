from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from fredapi import Fred
from pykrx import stock
import pymysql as pms
import yfinance as yf
import pandas as pd
import requests
import pymysql
import sys
import os


# Database information
database_info = open('./database_id.txt', 'r').readlines()

sql_file_path = database_info[0].replace('\n', '')
database_host_ip = database_info[1].replace('\n', '')
database_name = database_info[2].replace('\n', '')
database_id = database_info[3].replace('\n', '')
database_passwd = database_info[4].replace('\n', '')
database_charset = database_info[5].replace('\n', '')

# API KEY
API_key = open('./api_key.txt', 'r').readlines()

ko_bank_key = API_key[0].replace('\n', '')
fred_api_key = API_key[1].replace('\n', '')


# ================================================================== Function ==================================================================
# per pbr 계산 함수
def get_per_pbr_df(ticker_symbol, start_date, end_date):
    # 주식 데이터 다운로드
    ticker = yf.Ticker(ticker_symbol)
    data = ticker.history(start=start_date, end=end_date)
    
    # 재무 데이터 다운로드
    financials = ticker.financials
    balance_sheet = ticker.balance_sheet
    
    # EPS 및 BVPS 계산
    try:
        net_income = financials.loc['Net Income'].iloc[0]  # 최신 데이터 사용
        shares_outstanding = ticker.info.get('sharesOutstanding', None)
        if shares_outstanding is None:
            raise ValueError("Shares outstanding not available")
        eps = net_income / shares_outstanding
        
        total_assets = balance_sheet.loc['Total Assets'].iloc[0]
        total_liabilities = balance_sheet.loc['Total Liabilities Net Minority Interest'].iloc[0]  # 대체 가능한 키 사용
        book_value = total_assets - total_liabilities
        bvps = book_value / shares_outstanding
    except Exception as e:
        print(f"Error calculating EPS or BVPS: {e}")
        return pd.DataFrame()  # 빈 데이터프레임 반환
    
    # 기간 동안의 주가 데이터를 기반으로 PER 및 PBR 계산
    per_list = []
    pbr_list = []
    dates = []
    
    for date, row in data.iterrows():
        avg_price = row['Close']
        per = avg_price / eps
        pbr = avg_price / bvps
        per_list.append(per)
        pbr_list.append(pbr)
        dates.append(date)
    
    # 데이터프레임 생성
    result_df = pd.DataFrame({
        'Date': dates,
        'PER': per_list,
        'PBR': pbr_list
    })
    
    result_df.set_index('Date', inplace=True)
    return result_df

# 날짜 형식 변환 함수 
# 2024Q1  -> 20240101 
# 2024    -> 20240101
# 202401  -> 20240101
def check_time_data(check_time) :
    if 'Q1' in check_time :
        check_time = f'{check_time[:4]}0101'
    elif 'Q2' in check_time :
        check_time = f'{check_time[:4]}0401'
    elif 'Q3' in check_time :
        check_time = f'{check_time[:4]}0701'
    elif 'Q4' in check_time :
        check_time = f'{check_time[:4]}1001'
    elif len(check_time) <= 4 :
        check_time = f'{check_time}0101'
    elif len(check_time) <= 6 :
        check_time = f'{check_time}01'
    return check_time

def qchange(year, month) :
    if str(month) in ['01', '02', '03'] :
        month = 'Q1'
    elif str(month) in ['04', '05', '06'] :
        month = 'Q2'
    elif str(month) in ['07', '08', '09'] :
        month = 'Q3'
    elif str(month) in ['10', '11', '12'] :
        month ='Q4'
    return f'{year}{month}'

# 날짜 형식 변환 함수 (20240905 -> 2024-09-05)
def convert_date_format(date_str):
    return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"



print('============= stock data API Start =============')
print('Start time : ', datetime.today())

# 날짜 형식

month_date = str(datetime.now().month)
day_date = str(datetime.now().day)
if len(month_date) == 1 :
    month_date = f'0{month_date}'
if len(day_date) == 1 :
    day_date = f'0{day_date}'

up_date = datetime.now() - timedelta(90)
up_month, up_day = up_date.month, up_date.day
if len(str(up_month)) == 1 :
    up_month = f'0{up_month}'
if len(str(up_day)) == 1 :
    up_day = f'0{up_day}'

start_day = f'{up_date.year}-{up_month}-{up_day}'
end_day = f'{datetime.now().year}-{month_date}-{day_date}' #'2024-08-28'

start_date = datetime(int(up_date.year), int(up_month), int(up_day))
end_date = datetime(int(datetime.now().year), int(month_date), int(day_date))

date_df = pd.DataFrame(index=pd.date_range(start=start_date, end=end_date))
df_len = [] # 데이터 길이를 조절하기 위한 리스트


# ************************************** tb_stock **************************************
fdr_start_year = start_day[:4]

# Samsung(005930)
ticker = '005930.KS'
samsung = yf.Ticker(ticker)
samsung_stock = samsung.history(start=start_date, end=end_date)

samsung_stock.rename(columns={'Close' : 'sc_ss_stock'}, inplace=True)
samsung_stock = samsung_stock['sc_ss_stock']
samsung_stock = samsung_stock.reset_index()
samsung_stock['Date'] = samsung_stock['Date'].astype(str).map(lambda x : x[:10])
samsung_stock['Date'] = pd.to_datetime(samsung_stock['Date'])
samsung_stock.set_index(keys='Date', inplace=True)

# Samsung Market Capitalization
samsung_data = yf.download(ticker, start=start_date, end=end_date)
close_prices = samsung_data['Close']
shares_outstanding = samsung.info['sharesOutstanding']
samsung_market = close_prices * shares_outstanding
samsung_Market_Cap = pd.DataFrame({'sc_ss_mc': samsung_market})
samsung_Market_Cap['sc_ss_mc'] = samsung_Market_Cap['sc_ss_mc'].map(lambda x : int(x))

# Samsung PER, PBR, ROE
samsung_PER_PBR_ROE = stock.get_market_fundamental(start_day, end_day, "005930")[['PER', 'PBR']] # 삼성전자
samsung_PER_PBR_ROE.rename(columns={'PER' : 'sc_ss_per', 'PBR' : 'sc_ss_pbr'}, inplace=True)
samsung_PER_PBR_ROE['sc_ss_roe'] = samsung_PER_PBR_ROE['sc_ss_pbr'] / samsung_PER_PBR_ROE['sc_ss_per']

# Apple(AAPL)
# Apple Stock
ticker = 'AAPL'
apple = yf.Ticker(ticker)
apple_stock = apple.history(start=start_date, end=end_date)

apple_stock.rename(columns={'Close' : 'sc_ap_stock'}, inplace=True)
apple_stock = apple_stock['sc_ap_stock']
apple_stock = apple_stock.reset_index()
apple_stock['Date'] = apple_stock['Date'].astype(str).map(lambda x : x[:10])
apple_stock['Date'] = pd.to_datetime(apple_stock['Date'])
apple_stock.set_index(keys='Date', inplace=True)

# Apple Market Capitalization
apple_data = apple.history(start=start_date, end=end_date)
apple_Market_Cap = apple.info['sharesOutstanding'] * apple_data['Close']
apple_Market_Cap = pd.DataFrame({'sc_ap_mc': apple_Market_Cap})
apple_Market_Cap = apple_Market_Cap.reset_index()
apple_Market_Cap['Date'] = apple_Market_Cap['Date'].astype(str).map(lambda x : x[:10])
apple_Market_Cap['Date'] = pd.to_datetime(apple_Market_Cap['Date'])
apple_Market_Cap.set_index(keys='Date', inplace=True)
apple_Market_Cap['sc_ap_mc'] = apple_Market_Cap['sc_ap_mc'].map(lambda x : int(x))

# Apple PER, PBR, ROE
apple_PER_PBR_ROE = get_per_pbr_df("AAPL", start_day, end_day)
apple_PER_PBR_ROE.rename(columns={'PER' : 'sc_ap_per', 'PBR' : 'sc_ap_pbr'}, inplace=True)
apple_PER_PBR_ROE = apple_PER_PBR_ROE.reset_index(drop=False)
apple_PER_PBR_ROE['Date'] = apple_PER_PBR_ROE['Date'].astype(str).map(lambda x : x[:10])
apple_PER_PBR_ROE['Date'] = pd.to_datetime(apple_PER_PBR_ROE['Date'])
apple_PER_PBR_ROE.set_index(keys='Date', inplace=True)
apple_PER_PBR_ROE['sc_ap_roe'] = apple_PER_PBR_ROE['sc_ap_pbr'].astype(float) / apple_PER_PBR_ROE['sc_ap_per'].astype(float)


# Bit-Coin(BTC)
ticker = 'BTC-USD'
bitcoin = yf.Ticker(ticker)
bitcoin_stock = bitcoin.history(start=start_date, end=end_date)

bitcoin_stock.rename(columns={'Close' : 'sc_coin'}, inplace=True)
bitcoin_stock = bitcoin_stock['sc_coin']

bitcoin_stock = bitcoin_stock.reset_index()
bitcoin_stock['Date'] = bitcoin_stock['Date'].astype(str).map(lambda x : x[:10])
bitcoin_stock['Date'] = pd.to_datetime(bitcoin_stock['Date'])
bitcoin_stock.set_index(keys='Date', inplace=True)

# stock table insert
tb_stock_df_list = [samsung_stock, samsung_PER_PBR_ROE, samsung_Market_Cap,
                    apple_stock, apple_PER_PBR_ROE, apple_Market_Cap, 
                    bitcoin_stock]

stock_df = date_df.copy()
for i in range(len(tb_stock_df_list)) :
    stock_df = stock_df.join(tb_stock_df_list[i])

stock_df = stock_df.reset_index().rename(columns={'index' : 'fd_date'})
stock_df.fillna(method='ffill', inplace=True)
stock_df['fd_date'] = stock_df['fd_date'].astype(str).map(lambda x : x[:10])


# ************************************** tb_main_economic_index **************************************
# NASDAQ
nasdaq = yf.download('^IXIC', start=start_day, end='2024-12-31')
nasdaq.rename(columns={'Close': 'mei_nasdaq'}, inplace=True)
nasdaq = nasdaq['mei_nasdaq']

# S&P 500
snp500 = yf.download('^GSPC', start=start_day, end='2024-12-31')
snp500.rename(columns={'Close': 'mei_sp500'}, inplace=True)
snp500 = snp500['mei_sp500']

# Dow Jones Industrial Average (DJI)
dow = yf.download('^DJI', start=start_day, end='2024-12-31')
dow.rename(columns={'Close': 'mei_dow'}, inplace=True)
dow = dow['mei_dow']

# KOSPI
kospi = yf.download('^KS11', start=start_day, end='2024-12-31')
kospi.rename(columns={'Close': 'mei_kospi'}, inplace=True)
kospi = kospi['mei_kospi']

# Gold, Oil
today_date = datetime.today()-timedelta(1)
days_passed = (today_date - start_date).days

# Gold
gold = yf.Ticker('GC=F')
gold_data = gold.history(period='max').tail(days_passed)
gold_data.rename(columns={'Close' : 'mei_gold'}, inplace=True)
gold_data = gold_data['mei_gold']
gold_data = gold_data.reset_index(drop=False)
gold_data['Date'] = gold_data['Date'].astype(str).map(lambda x : x[:10])
gold_data['Date'] = pd.to_datetime(gold_data['Date'])
gold_data.set_index(keys='Date', inplace=True)

# Oil
oil = yf.Ticker('BZ=F')
oil_data = oil.history(period='max').tail(days_passed)
oil_data.rename(columns={'Close' : 'mei_oil'}, inplace=True)
oil_data = oil_data['mei_oil']
oil_data = oil_data.reset_index(drop=False)
oil_data['Date'] = oil_data['Date'].astype(str).map(lambda x : x[:10])
oil_data['Date'] = pd.to_datetime(oil_data['Date'])
oil_data.set_index(keys='Date', inplace=True)

# Exchange Rate
dollar_to_won = yf.download('KRW=X', start_day)
dollar_to_won.rename(columns={'Close' : 'mei_ex_rate'}, inplace=True)
dollar_to_won = dollar_to_won['mei_ex_rate']

# main economic index table insert
tb_main_economic_index_df_list = [nasdaq, snp500, dow, kospi, gold_data, oil_data, dollar_to_won]

main_economic_index_df = date_df.copy()
for i in range(len(tb_main_economic_index_df_list)) :
    main_economic_index_df = main_economic_index_df.join(tb_main_economic_index_df_list[i])

main_economic_index_df = main_economic_index_df.reset_index().rename(columns={'index' : 'fd_date'})
main_economic_index_df.fillna(method='ffill', inplace=True)
main_economic_index_df['fd_date'] = main_economic_index_df['fd_date'].astype(str).map(lambda x : x[:10])


# ************************************** tb_korea_economic_indicator **************************************
data_name_ko = ['국내 총 생산',
            'M2 통화공급 (말잔)',
            'M2 통화공급 (평잔)',
            '중앙은행 기준금리',
            '생산자물가지수',
            '수입물가지수',
            '소비자물가지수',
            '수입',
            '수출',
            '소비자심리지수',
            '기업경기실사지수']

data_name = ['kei_gdp',
            'kei_m2_end',
            'kei_m2_avg',
            'kei_fed_rate',
            'kei_ppi',
            'kei_ipi',
            'kei_cpi',
            'kei_imp',
            'kei_exp',
            'kei_cs',
            'kei_bsi']

api_link = [f'/200Y102/Q/{qchange(up_date.year, up_month)}/{qchange(datetime.now().year, month_date)}/10111',
            f'/101Y007/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/BBIA00',
            f'/101Y008/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/BBJA00',
            f'/722Y001/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/0101000',
            f'/404Y014/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/*AA',
            f'/401Y015/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/*AA/W',
            f'/901Y009/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/0',
            f'/403Y003/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/*AA',
            f'/403Y001/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/*AA',
            f'/511Y002/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/FME/99988',
            f'/512Y007/M/{up_date.year}{up_month}/{datetime.now().year}{month_date}/AA/99988']

all_data = []
all_time = []
for i in range(len(api_link)) :
    value_time = []
    value_data = []
    search_url = f'https://ecos.bok.or.kr/api/StatisticSearch/{ko_bank_key}/xml/kr/1/1{api_link[i]}'

    search_respons = requests.get(search_url)
    search_xml = search_respons.text
    search_soup = BeautifulSoup(search_xml, 'xml')
    total_val = search_soup.find('list_total_count')
    url = f'https://ecos.bok.or.kr/api/StatisticSearch/{ko_bank_key}/xml/kr/1/{total_val.text}{api_link[i]}'
    respons = requests.get(url)
    title_xml = respons.text
    title_soup = BeautifulSoup(title_xml, 'xml') 
    value_d = title_soup.find_all('DATA_VALUE')
    value_t = title_soup.find_all('TIME')
    for j in value_d : 
        value_data.append(j.text)
    for j in value_t :
        check_time = check_time_data(j.text)
        value_time.append(check_time)
    all_time.append(value_time)
    all_data.append(value_data)

all_time = [[convert_date_format(date) for date in row] for row in all_time]


# korea economic indicator table insert
korea_economic_indicator_df = date_df.copy()
for i in range(0, 11) :
    ko_eco_indi = pd.DataFrame({'Date' :  pd.to_datetime(all_time[i]), data_name[i] : all_data[i]}).set_index('Date')
    korea_economic_indicator_df = korea_economic_indicator_df.join(ko_eco_indi)
korea_economic_indicator_df = korea_economic_indicator_df.reset_index().rename(columns={'index' : 'fd_date'})

korea_economic_indicator_df.fillna(method='ffill', inplace=True)
korea_economic_indicator_df['fd_date'] = korea_economic_indicator_df['fd_date'].astype(str).map(lambda x : x[:10])


# ************************************** tb_us_economic_indicator **************************************
fred = Fred(api_key=fred_api_key)

indicators = {
    "uei_gdp": "GDP",
    "uei_fed_rate": "FEDFUNDS",
    "uei_ipi": "IR",
    "uei_ppi": "PPIACO",
    "uei_cpi": "CPIAUCSL",
    "uei_cpi_m": "CPIAUCNS",
    "uei_trade": "BOPGSTB",
    "uei_cb_cc": "CSCICP03USM665S",
    "uei_ps_m": "PCE",
    "uei_rs_m": "RSXFS",
    "uei_umich_cs": "UMCSENT"
}

us_economic_indicator_dic = {}
for name, series_id in indicators.items():
    try:
        us_economic_indicator_dic[name] = fred.get_series(series_id, observation_start=start_date, observation_end=end_date)
    except ValueError as e:
        print(f"Error fetching {name}: {e}")

us_economic_indicator_df = date_df.copy()
wei_dic = pd.DataFrame(us_economic_indicator_dic)
us_economic_indicator_df = us_economic_indicator_df.join(wei_dic)
us_economic_indicator_df = us_economic_indicator_df.reset_index().rename(columns={'index' : 'fd_date'})
us_economic_indicator_df.fillna(method='ffill', inplace=True)
us_economic_indicator_df['fd_date'] = us_economic_indicator_df['fd_date'].astype(str).map(lambda x : x[:10])


# tb_finance_date
date_df = date_df.reset_index().rename(columns={'index' : 'fd_date'})
date_df['fd_date'] = date_df['fd_date'].astype(str).map(lambda x : x[:10])

# Excel save
df_len.append(len(stock_df.dropna(axis=0)))
df_len.append(len(main_economic_index_df.dropna(axis=0)))
df_len.append(len(korea_economic_indicator_df.dropna(axis=0)))
df_len.append(len(us_economic_indicator_df.dropna(axis=0)))
df_len = min(df_len)

# create dataframes of stock
df_finance_date = date_df.tail(df_len)
df_stock = stock_df.tail(df_len)
df_main_economic_index = main_economic_index_df.tail(df_len)
df_korea_economic_indicator = korea_economic_indicator_df.tail(df_len)
df_us_economic_indicator = us_economic_indicator_df.tail(df_len)

# 데이터베이스 테이블명 설정
database_tables_name = [
    'tb_finance_date', # 1
    'tb_stock', # 2
    'tb_korea_economic_indicator', # 3
    'tb_us_economic_indicator', # 4
    'tb_main_economic_index', # 5
]

# 데이터프레임 순서 지정
all_tables_df = [
    df_finance_date, df_stock, df_korea_economic_indicator, 
    df_us_economic_indicator, df_main_economic_index, 
]

# 데이터베이스 연결
conn = pymysql.connect(
    host=database_host_ip,
    user=database_id,
    password=database_passwd,
    charset=database_charset
)

cur = conn.cursor()
print(f'========== DATABASE Connect ==========')

# 데이터베이스 사용 
cur.execute(f"USE {database_name}")

print(f'========== Insert query start! ==========')
table_num = 0

# tb_finance_date
print(f'========== {table_num} {database_tables_name[table_num]} Update start ==========')
for index, row in all_tables_df[table_num].iterrows() :
    cur.execute("""
        INSERT INTO tb_finance_date (
            fd_date
        ) VALUES (%s)
        ON DUPLICATE KEY UPDATE fd_date = VALUES(fd_date);
    """, (
        row['fd_date'],
    ))
print(f'========== {table_num} {database_tables_name[table_num]} Update end ==========')
table_num += 1

# tb_stock
print(f'========== {table_num} {database_tables_name[table_num]} Update start ==========')
for index, row in all_tables_df[table_num].iterrows():
    # 먼저 해당 fd_date가 있는지 확인
    cur.execute("""
        SELECT COUNT(*) FROM tb_stock WHERE fd_date = %s;
    """, (row['fd_date'],))
    result = cur.fetchone()
    
    if result[0] > 0:
        # 이미 존재하는 경우 UPDATE
        cur.execute("""
            UPDATE tb_stock SET 
                sc_ss_stock = %s,
                sc_ss_per = %s,
                sc_ss_pbr = %s,
                sc_ss_roe = %s,
                sc_ss_mc = %s,
                sc_ap_stock = %s,
                sc_ap_per = %s,
                sc_ap_pbr = %s,
                sc_ap_roe = %s,
                sc_ap_mc = %s,
                sc_coin = %s
            WHERE fd_date = %s;
        """, (
            row['sc_ss_stock'],
            row['sc_ss_per'],
            row['sc_ss_pbr'],
            row['sc_ss_roe'],
            row['sc_ss_mc'],
            row['sc_ap_stock'],
            row['sc_ap_per'],
            row['sc_ap_pbr'],
            row['sc_ap_roe'],
            row['sc_ap_mc'],
            row['sc_coin'],
            row['fd_date']
        ))
    else:
        # 존재하지 않는 경우 INSERT
        cur.execute("""
            INSERT INTO tb_stock (
                fd_date,
                sc_ss_stock,
                sc_ss_per,
                sc_ss_pbr,
                sc_ss_roe,
                sc_ss_mc,
                sc_ap_stock,
                sc_ap_per,
                sc_ap_pbr,
                sc_ap_roe,
                sc_ap_mc,
                sc_coin
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            row['fd_date'],
            row['sc_ss_stock'],
            row['sc_ss_per'],
            row['sc_ss_pbr'],
            row['sc_ss_roe'],
            row['sc_ss_mc'],
            row['sc_ap_stock'],
            row['sc_ap_per'],
            row['sc_ap_pbr'],
            row['sc_ap_roe'],
            row['sc_ap_mc'],
            row['sc_coin']
        ))
print(f'========== {table_num} {database_tables_name[table_num]} Update end ==========')
table_num += 1

# tb_korea_economic_indicator
print(f'========== {table_num} {database_tables_name[table_num]} Update start ==========')
for index, row in all_tables_df[table_num].iterrows() :
    cur.execute("""
        SELECT COUNT(*) FROM tb_korea_economic_indicator WHERE fd_date = %s;
    """, row['fd_date'])
    result = cur.fetchone()

    if result[0] > 0 :
        cur.execute('''
            UPDATE tb_korea_economic_indicator SET
                kei_gdp = %s,
                kei_m2_end = %s,
                kei_m2_avg = %s,
                kei_fed_rate = %s,
                kei_ppi = %s,
                kei_ipi = %s,
                kei_cpi = %s,
                kei_imp = %s,
                kei_exp = %s,
                kei_cs = %s,
                kei_bsi = %s
            WHERE fd_date = %s;
        ''', (
            row['kei_gdp'],
            row['kei_m2_end'],
            row['kei_m2_avg'],
            row['kei_fed_rate'],
            row['kei_ppi'],
            row['kei_ipi'],
            row['kei_cpi'],
            row['kei_imp'],
            row['kei_exp'],
            row['kei_cs'],
            row['kei_bsi'],
            row['fd_date']
        ))
    else :
        cur.execute('''
        INSERT INTO tb_korea_economic_indicator (
                fd_date,
                kei_gdp,
                kei_m2_end,
                kei_m2_avg,
                kei_fed_rate,
                kei_ppi,
                kei_ipi,
                kei_cpi,
                kei_imp,
                kei_exp,
                kei_cs,
                kei_bsi
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        ''', (
            row['fd_date'],
            row['kei_gdp'],
            row['kei_m2_end'],
            row['kei_m2_avg'],
            row['kei_fed_rate'],
            row['kei_ppi'],
            row['kei_ipi'],
            row['kei_cpi'],
            row['kei_imp'],
            row['kei_exp'],
            row['kei_cs'],
            row['kei_bsi']
        ))
print(f'========== {table_num} {database_tables_name[table_num]} Update end ==========')
table_num += 1

# tb_us_economic_indicator
print(f'========== {table_num} {database_tables_name[table_num]} Update start ==========')
for index, row in all_tables_df[table_num].iterrows() :
    cur.execute('''
        SELECT COUNT(*) FROM tb_us_economic_indicator WHERE fd_date = %s
    ''', row['fd_date'])
    result = cur.fetchone()

    if result[0] > 0 :
        cur.execute('''
            UPDATE tb_us_economic_indicator SET (
                uei_gdp = %s,
                uei_fed_rate = %s,
                uei_ipi = %s,
                uei_ppi = %s,
                uei_cpi = %s,
                uei_cpi_m = %s,
                uei_trade = %s,
                uei_cb_cc = %s,
                uei_ps_m = %s,
                uei_rs_m = %s,
                uei_umich_cs = %s
            WHERE fd_date = %s
            )
        ''', (
            row['uei_gdp'],
            row['uei_fed_rate'],
            row['uei_ipi'],
            row['uei_ppi'],
            row['uei_cpi'],
            row['uei_cpi_m'],
            row['uei_trade'],
            row['uei_cb_cc'],
            row['uei_ps_m'],
            row['uei_rs_m'],
            row['uei_umich_cs'],
            row['fd_date']
            ))
    else :
        cur.execute("""
            INSERT INTO tb_us_economic_indicator (
                fd_date,
                uei_gdp,
                uei_fed_rate,
                uei_ipi,
                uei_ppi,
                uei_cpi,
                uei_cpi_m,
                uei_trade,
                uei_cb_cc,
                uei_ps_m,
                uei_rs_m,
                uei_umich_cs
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            row['fd_date'],
            row['uei_gdp'],
            row['uei_fed_rate'],
            row['uei_ipi'],
            row['uei_ppi'],
            row['uei_cpi'],
            row['uei_cpi_m'],
            row['uei_trade'],
            row['uei_cb_cc'],
            row['uei_ps_m'],
            row['uei_rs_m'],
            row['uei_umich_cs']
        ))
print(f'========== {table_num} {database_tables_name[table_num]} Update end ==========')
table_num += 1

# tb_main_economic_index
print(f'========== {table_num} {database_tables_name[table_num]} Update start ==========')
for index, row in all_tables_df[table_num].iterrows() :
    cur.execute('''
        SELECET COUNT(*) FROM tb_main_economic_index WHERE fd_date = %s
    ''', row['fd_date'])
    result = cur.fetchone()
    if result[0] > 0 :
        cur.execute('''
            UPDATE tb_main_economic_index SET (
                mei_nasdaq = %s,
                mei_sp500 = %s,
                mei_dow = %s,
                mei_kospi = %s,
                mei_gold = %s,
                mei_oil = %s,
                mei_ex_rate = %s,
            WHERE fd_date = %s
            )
        ''', (
            row['mei_nasdaq'],
            row['mei_sp500'],
            row['mei_dow'],
            row['mei_kospi'],
            row['mei_gold'],
            row['mei_oil'],
            row['mei_ex_rate']
        ))
    else :
        cur.execute("""
            INSERT INTO tb_main_economic_index (
                fd_date,
                mei_nasdaq,
                mei_sp500,
                mei_dow,
                mei_kospi,
                mei_gold,
                mei_oil,
                mei_ex_rate
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            row['fd_date'],
            row['mei_nasdaq'],
            row['mei_sp500'],
            row['mei_dow'],
            row['mei_kospi'],
            row['mei_gold'],
            row['mei_oil'],
            row['mei_ex_rate']
        ))
print(f'========== {table_num} {database_tables_name[table_num]} Update end ==========')

print('========== Update Query End ==========')

conn.commit()
conn.close()
print('========== DATABASE Connect End ==========')