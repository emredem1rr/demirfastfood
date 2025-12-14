import tkinter as tk
from tkinter import messagebox
import http.client
import json
from urllib.parse import quote
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

def get_duty_pharmacies(city, district):
    try:
        api_key = os.getenv("COLLECTAPI_KEY")
        if not api_key:
            raise Exception("API key bulunamadı")

        conn = http.client.HTTPSConnection("api.collectapi.com")

        headers = {
            "content-type": "application/json",
            "authorization": f"apikey {api_key}"
        }

        encoded_city = quote(city, safe="")
        encoded_district = quote(district, safe="")

        query = f"/health/dutyPharmacy?il={encoded_city}&ilce={encoded_district}"

        conn.request("GET", query, headers=headers)
        res = conn.getresponse()
        data = res.read().decode("utf-8")

        conn.close()
        return json.loads(data)

    except Exception as e:
        print("Hata:", e)
        return {"success": False}

def show_duty_pharmacies():
    city = city_entry.get().strip()
    district = district_entry.get().strip()

    if not city or not district:
        messagebox.showerror("Hata", "Lütfen şehir ve ilçe bilgisini girin.")
        return

    duty_pharmacies = get_duty_pharmacies(city, district)

    if duty_pharmacies.get("success"):
        result_text.config(state="normal")
        result_text.delete("1.0", tk.END)

        result_text.insert(
            tk.END,
            f"Nöbetçi Eczaneler ({city}, {district})\n\n"
        )

        for pharmacy in duty_pharmacies["result"]:
            result_text.insert(
                tk.END,
                f"🏥 {pharmacy['name']}\n📍 {pharmacy['address']}\n\n"
            )

        result_text.config(state="disabled")
    else:
        messagebox.showerror(
            "Hata",
            "Nöbetçi eczaneler alınamadı.\nŞehir ve ilçe bilgisini kontrol edin."
        )

# ---------------- TKINTER ARAYÜZ ---------------- #

root = tk.Tk()
root.title("Nöbetçi Eczane Sorgulama")
root.resizable(False, False)

tk.Label(root, text="Şehir:", font=("Helvetica", 12)).grid(
    row=0, column=0, padx=5, pady=5, sticky="w"
)

tk.Label(root, text="İlçe:", font=("Helvetica", 12)).grid(
    row=1, column=0, padx=5, pady=5, sticky="w"
)

city_entry = tk.Entry(root, width=35)
city_entry.grid(row=0, column=1, padx=5, pady=5)

district_entry = tk.Entry(root, width=35)
district_entry.grid(row=1, column=1, padx=5, pady=5)

tk.Button(
    root,
    text="Sorgula",
    command=show_duty_pharmacies,
    font=("Helvetica", 10)
).grid(row=2, column=0, columnspan=2, pady=8)

result_text = tk.Text(root, width=55, height=15, state="disabled")
result_text.grid(row=3, column=0, columnspan=2, padx=5, pady=5)

root.mainloop()
