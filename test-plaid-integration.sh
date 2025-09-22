#!/bin/bash

echo "🧪 Testing Plaid Integration - CFO Assistant"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test API server
echo -e "\n${YELLOW}1. Testing API Server...${NC}"
API_STATUS=$(curl -s http://localhost:3001/api/v1/health | jq -r '.status')
if [ "$API_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ API Server is running${NC}"
else
    echo -e "${RED}❌ API Server is not responding${NC}"
    exit 1
fi

# Test authentication
echo -e "\n${YELLOW}2. Testing Authentication...${NC}"
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@coxist.ai", "password": "password123"}' \
    | jq -r '.data.tokens.accessToken')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
fi

# Test Plaid Link Token Creation
echo -e "\n${YELLOW}3. Testing Plaid Link Token Creation...${NC}"
LINK_TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/cfo/plaid/create-link-token \
    -H "Authorization: Bearer $TOKEN")

LINK_TOKEN=$(echo $LINK_TOKEN_RESPONSE | jq -r '.data.linkToken')
if [ "$LINK_TOKEN" != "null" ] && [ -n "$LINK_TOKEN" ]; then
    echo -e "${GREEN}✅ Plaid Link Token created successfully${NC}"
    echo "   Token: ${LINK_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Plaid Link Token creation failed${NC}"
    echo "   Response: $LINK_TOKEN_RESPONSE"
fi

# Test CFO Dashboard
echo -e "\n${YELLOW}4. Testing CFO Dashboard...${NC}"
DASHBOARD_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/v1/cfo/dashboard/summary?period=30" \
    -H "Authorization: Bearer $TOKEN")

DASHBOARD_SUCCESS=$(echo $DASHBOARD_RESPONSE | jq -r '.success')
if [ "$DASHBOARD_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ CFO Dashboard endpoint working${NC}"
else
    echo -e "${RED}❌ CFO Dashboard endpoint failed${NC}"
    echo "   Response: $DASHBOARD_RESPONSE"
fi

# Test Transactions
echo -e "\n${YELLOW}5. Testing Transactions...${NC}"
TRANSACTIONS_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/v1/cfo/transactions?page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN")

TRANSACTIONS_SUCCESS=$(echo $TRANSACTIONS_RESPONSE | jq -r '.success')
if [ "$TRANSACTIONS_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ Transactions endpoint working${NC}"
else
    echo -e "${RED}❌ Transactions endpoint failed${NC}"
    echo "   Response: $TRANSACTIONS_RESPONSE"
fi

# Test Web Application
echo -e "\n${YELLOW}6. Testing Web Application...${NC}"
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Web application is running${NC}"
else
    echo -e "${RED}❌ Web application is not responding (HTTP $WEB_RESPONSE)${NC}"
fi

echo -e "\n${GREEN}🎉 All tests completed!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login with admin@coxist.ai / password123"
echo "3. Go to CFO Dashboard and click 'Connect Bank Account'"
echo "4. Use Plaid sandbox credentials: user_good / pass_good"
echo "5. Test the Transactions page and filtering features"
