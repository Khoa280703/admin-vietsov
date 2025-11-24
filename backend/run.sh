#!/bin/bash

# Script to build and run the .NET API with clear output

echo "==========================================="
echo "Building Vietsov API..."
echo "==========================================="

cd "$(dirname "$0")"

# Build first
dotnet build --verbosity minimal
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "❌ Build failed with exit code $BUILD_EXIT_CODE"
    exit $BUILD_EXIT_CODE
fi

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "==========================================="
echo "Starting Vietsov API server..."
echo "==========================================="
echo ""

# Run the application
dotnet run --no-build

