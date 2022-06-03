import pandas as pd

a = pd.read_csv("demo.csv")
a.to_html("Table.html")
html_file = a.to_html()