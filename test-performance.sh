#!/bin/bash
# Performance Test Script for Adliye Teftiş Yardımcısı
# Bu script sayfa yükleme hızlarını test eder

echo "==================================="
echo "Performans Testi Başlatılıyor..."
echo "==================================="
echo ""

# Test URL (localhost veya production)
BASE_URL="${1:-http://localhost:8080}"

echo "Test Edilen URL: $BASE_URL"
echo ""

# Sayfalar listesi
PAGES=(
  "/"
  "/iddianame"
  "/istinaf"
  "/temyiz"
  "/kesinlesme"
  "/kesinlesme-kontrol"
  "/kesinlesmek"
  "/karar"
  "/harctahsilkontrol"
  "/yargilamagideri"
  "/kanunyolu"
  "/jrobot"
  "/tensip"
  "/byu"
  "/durusmakacagi"
  "/gerekcelikarar"
)

# Sonuçları saklamak için dosya
RESULT_FILE="/tmp/performance_results.txt"
echo "Sayfa,Yükleme Süresi (ms),Durum" > $RESULT_FILE

echo "| Sayfa | Yükleme Süresi | Durum |"
echo "|-------|---------------|--------|"

for page in "${PAGES[@]}"; do
  URL="${BASE_URL}${page}"
  
  # curl ile sayfa yükleme süresini ölç
  RESPONSE=$(curl -o /dev/null -s -w "%{http_code},%{time_total}" "$URL")
  HTTP_CODE=$(echo $RESPONSE | cut -d',' -f1)
  TIME_TOTAL=$(echo $RESPONSE | cut -d',' -f2)
  
  # Milisaniyeye çevir
  TIME_MS=$(echo "$TIME_TOTAL * 1000" | bc -l | cut -d'.' -f1)
  
  # Durum belirle
  if [ "$HTTP_CODE" = "200" ]; then
    if [ "$TIME_MS" -lt 100 ]; then
      STATUS="✅ Çok Hızlı"
    elif [ "$TIME_MS" -lt 300 ]; then
      STATUS="✅ Hızlı"
    elif [ "$TIME_MS" -lt 1000 ]; then
      STATUS="⚠️ Orta"
    else
      STATUS="❌ Yavaş"
    fi
  else
    STATUS="❌ Hata ($HTTP_CODE)"
    TIME_MS="-"
  fi
  
  echo "| $page | ${TIME_MS}ms | $STATUS |"
  echo "$page,$TIME_MS,$STATUS" >> $RESULT_FILE
done

echo ""
echo "==================================="
echo "Test Tamamlandı!"
echo "Detaylı sonuçlar: $RESULT_FILE"
echo "==================================="
