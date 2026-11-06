#!/bin/sh
# Bütün testler. Her değişiklikten sonra çalıştırın:  sh tests/run.sh
# Tarayıcı testini atlamak için:  SMOKE=0 sh tests/run.sh
cd "$(dirname "$0")/.." || exit 1
set -e
echo "== kaynak denetimleri =="
python3 tests/test_kaynak.py
if [ "${SMOKE:-1}" != "0" ]; then
  echo
  echo "== tarayıcı duman testi =="
  python3 tests/smoke.py
  echo
  echo "== altın test (davranış referansı) =="
  python3 tests/altin.py
fi
