#!/usr/bin/env bash
# ============================================================
# FinControl — roda o backend em localhost (sem Docker), perfil development.
# Requisitos: Java 21 + Maven (ou ./mvnw incluído) + MongoDB em
# mongodb://localhost:27017 (ou ajuste MONGODB_URI abaixo).
#
# Uso:
#   bash scripts/dev-backend.sh
# ============================================================
set -e
cd "$(dirname "$0")/.."

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-development}"
export MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/fincontrol_dev}"
export JWT_SECRET="${JWT_SECRET:-dev-only-chave-jwt-troque-em-producao-123456}"
export JWT_EXPIRATION="${JWT_EXPIRATION:-PT8H}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:5500,http://localhost:3000,http://localhost:5173,http://localhost:8081,http://127.0.0.1:5500}"

echo "▶ Subindo backend (profile=$SPRING_PROFILES_ACTIVE) em http://localhost:8080 ..."
echo "  MONGODB_URI=$MONGODB_URI"
echo "  FRONTEND_URL=$FRONTEND_URL"

cd backend
./mvnw -q spring-boot:run