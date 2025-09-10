#!/bin/bash

# Script to switch between local and staging environments for stress testing

ENV=${1:-local}

if [ "$ENV" = "local" ]; then
    echo "🔄 Switching to LOCAL environment..."
    export TEST_ENVIRONMENT=local
    export USE_EMULATOR=true
    export EMULATOR_HOST=127.0.0.1
    export EMULATOR_FUNCTIONS_PORT=5001
    export EMULATOR_FIRESTORE_PORT=8081
    export EMULATOR_AUTH_PORT=9099
    export LOCAL_BACKEND_URL=http://localhost:5001
    
    echo "✅ Environment set to LOCAL:"
    echo "   - Backend: http://localhost:5001"
    echo "   - Firestore: 127.0.0.1:8081 (emulator)"
    echo "   - Auth: 127.0.0.1:9099 (emulator)"
    
elif [ "$ENV" = "staging" ]; then
    echo "🔄 Switching to STAGING environment..."
    export TEST_ENVIRONMENT=staging
    export USE_EMULATOR=false
    export LOCAL_BACKEND_URL=https://europe-central2-manele-io-test.cloudfunctions.net
    
    echo "✅ Environment set to STAGING:"
    echo "   - Backend: https://europe-central2-manele-io-test.cloudfunctions.net"
    echo "   - Firestore: production"
    echo "   - Auth: production"
    
else
    echo "❌ Invalid environment. Use 'local' or 'staging'"
    echo "Usage: source scripts/switch-env.sh [local|staging]"
    exit 1
fi

echo ""
echo "🚀 Now you can run stress tests with:"
echo "   npm run stress-test [count]"
echo ""
echo "💡 To make this permanent, add to your .env file:"
echo "   TEST_ENVIRONMENT=$ENV"
