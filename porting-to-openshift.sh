#!/bin/zsh

# ============================================================
# JOB SEKALI (PARALLEL ORACLE JOB) - DEPLOYMENT TO OPENSHIFT
# ============================================================
# Script untuk build dan deploy job-sekali ke OpenShift
# 
# Prerequisites:
# - oc CLI installed dan sudah login ke OpenShift cluster
# - Docker installed
# - Go 1.21+ installed

if [ $# -lt 1 ]
then
    echo "Perintah:"
    echo "    ./porting-to-openshift.sh login"
    echo "    ./porting-to-openshift.sh <version>"
    echo "    ./porting-to-openshift.sh <tag_name> <project_name>"
    echo "    ./porting-to-openshift.sh <tag_name> <project_name> <server_openshift>"
    echo ""
    echo "Default:"
    echo "    server_openshift: default-route-openshift-image-registry.apps.ocp-drc.bpjsketenagakerjaan.go.id"
    echo "    project_name: kn-jkp"
    echo ""
    echo "Example:"
    echo "    ./porting-to-openshift.sh login"
    echo "    ./porting-to-openshift.sh 1.0.0"
    echo "    ./porting-to-openshift.sh job-sekali:v1.0.0 kn-jkp"
    exit 1
fi

# Default values
DEFAULT_REGISTRY="default-route-openshift-image-registry.apps.ocp-drc.bpjsketenagakerjaan.go.id"
DEFAULT_PROJECT="lastri-dev"
DEFAULT_IMAGE_NAME="lastri"

echo "============================================================"
echo "JOB SEKALI - DEPLOYMENT"
echo "============================================================"

# ============================================================
# LOGIN TO OPENSHIFT REGISTRY
# ============================================================
if [ "$1" = "login" ]
then
    echo "🔐 Logging in to OpenShift registry..."
    echo "Registry: $DEFAULT_REGISTRY"
    docker login -u pti-dev -p $(oc whoami -t) $DEFAULT_REGISTRY
    
    if [ $? -eq 0 ]; then
        echo "✅ Login successful!"
    else
        echo "❌ Login failed!"
        exit 1
    fi
    exit 0
fi

# ============================================================
# BUILD GO BINARY (VERSION ONLY)
# ============================================================
if [ $# -eq 1 ]
then
    VERSION=$1
    IMAGE_TAG="${DEFAULT_IMAGE_NAME}:v${VERSION}"
    REGISTRY_IMAGE="${DEFAULT_REGISTRY}/${DEFAULT_PROJECT}/${IMAGE_TAG}"
    
    echo "📦 Building job-sekali version: v${VERSION}"
    echo "Image: ${IMAGE_TAG}"
    echo "Registry: ${REGISTRY_IMAGE}"
    echo ""
    
    # Build Docker image (multi-stage build handles Go compilation)
    echo "🐳 Building Docker image (multi-stage build)..."
    docker build --platform=linux/amd64 -t ${IMAGE_TAG} .
    
    if [ $? -ne 0 ]; then
        echo "❌ Docker build failed!"
        exit 1
    fi
    
    echo "✅ Docker build successful!"
    echo ""
    
    # Tag image
    echo "🏷️  Tagging image..."
    docker tag ${IMAGE_TAG} ${REGISTRY_IMAGE}
    echo "✅ Tagged: ${REGISTRY_IMAGE}"
    echo ""
    
    # Push to registry
    echo "📤 Pushing to OpenShift registry..."
    docker push ${REGISTRY_IMAGE}
    
    if [ $? -eq 0 ]; then
        echo "✅ Push successful!"
        echo ""
        echo "============================================================"
        echo "✅ DEPLOYMENT COMPLETE!"
        echo "============================================================"
        echo "Image: ${REGISTRY_IMAGE}"
        echo ""
        echo "Next steps:"
        echo "1. Update deployment.yaml to use this image"
        echo "2. Apply deployment: oc apply -f deployment.yaml"
        echo "3. Verify: oc get pods -n ${DEFAULT_PROJECT}"
    else
        echo "❌ Push failed!"
        exit 1
    fi
    
    exit 0
fi

# ============================================================
# BUILD WITH CUSTOM TAG AND PROJECT
# ============================================================
if [ $# -eq 2 ]
then
    IMAGE_TAG=$1
    PROJECT=$2
    REGISTRY_IMAGE="${DEFAULT_REGISTRY}/${PROJECT}/${IMAGE_TAG}"
    
    echo "📦 Building job-sekali"
    echo "Image: ${IMAGE_TAG}"
    echo "Project: ${PROJECT}"
    echo "Registry: ${REGISTRY_IMAGE}"
    echo ""
    
    # Build Docker image (multi-stage build handles Go compilation)
    echo "🐳 Building Docker image (multi-stage build)..."
    docker build --platform=linux/amd64 -t ${IMAGE_TAG} .
    
    if [ $? -ne 0 ]; then
        echo "❌ Docker build failed!"
        exit 1
    fi
    
    echo "✅ Docker build successful!"
    echo ""
    
    # Tag image
    echo "🏷️  Tagging image..."
    docker tag ${IMAGE_TAG} ${REGISTRY_IMAGE}
    echo "✅ Tagged: ${REGISTRY_IMAGE}"
    echo ""
    
    # Push to registry
    echo "📤 Pushing to OpenShift registry..."
    docker push ${REGISTRY_IMAGE}
    
    if [ $? -eq 0 ]; then
        echo "✅ Push successful!"
        echo ""
        echo "============================================================"
        echo "✅ DEPLOYMENT COMPLETE!"
        echo "============================================================"
        echo "Image: ${REGISTRY_IMAGE}"
        echo ""
        echo "Next steps:"
        echo "1. Update deployment.yaml to use this image"
        echo "2. Apply deployment: oc apply -f deployment.yaml"
        echo "3. Verify: oc get pods -n ${PROJECT}"
    else
        echo "❌ Push failed!"
        exit 1
    fi
    
    exit 0
fi

# ============================================================
# BUILD WITH CUSTOM TAG, PROJECT, AND REGISTRY
# ============================================================
if [ $# -eq 3 ]
then
    IMAGE_TAG=$1
    PROJECT=$2
    REGISTRY=$3
    REGISTRY_IMAGE="${REGISTRY}/${PROJECT}/${IMAGE_TAG}"
    
    echo "📦 Building job-sekali"
    echo "Image: ${IMAGE_TAG}"
    echo "Project: ${PROJECT}"
    echo "Registry: ${REGISTRY}"
    echo "Full path: ${REGISTRY_IMAGE}"
    echo ""
    
    # Build Docker image (multi-stage build handles Go compilation)
    echo "🐳 Building Docker image (multi-stage build)..."
    docker build --platform=linux/amd64 -t ${IMAGE_TAG} .
    
    if [ $? -ne 0 ]; then
        echo "❌ Docker build failed!"
        exit 1
    fi
    
    echo "✅ Docker build successful!"
    echo ""
    
    # Tag image
    echo "🏷️  Tagging image..."
    docker tag ${IMAGE_TAG} ${REGISTRY_IMAGE}
    echo "✅ Tagged: ${REGISTRY_IMAGE}"
    echo ""
    
    # Push to registry
    echo "📤 Pushing to OpenShift registry..."
    docker push ${REGISTRY_IMAGE}
    
    if [ $? -eq 0 ]; then
        echo "✅ Push successful!"
        echo ""
        echo "============================================================"
        echo "✅ DEPLOYMENT COMPLETE!"
        echo "============================================================"
        echo "Image: ${REGISTRY_IMAGE}"
        echo ""
        echo "Next steps:"
        echo "1. Update deployment.yaml to use this image"
        echo "2. Apply deployment: oc apply -f deployment.yaml"
        echo "3. Verify: oc get pods -n ${PROJECT}"
    else
        echo "❌ Push failed!"
        exit 1
    fi
    
    exit 0
fi
