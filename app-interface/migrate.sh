#!/bin/bash

# Migration script to move app-interface-solana into the monorepo

set -e  # Exit on error

MONOREPO_DIR="/Users/paulvanmierlo/spout-finance"
SOURCE_DIR="/Users/paulvanmierlo/app-interface-solana"
TARGET_DIR="$MONOREPO_DIR/app-interface"

echo "🚀 Starting migration to monorepo..."

# Step 1: Check if monorepo exists, clone if not
if [ ! -d "$MONOREPO_DIR" ]; then
    echo "📦 Cloning monorepo..."
    cd /Users/paulvanmierlo
    git clone https://github.com/SpoutSolana/spout-finance.git
else
    echo "✅ Monorepo already exists"
fi

# Step 2: Backup existing app-interface if it exists
if [ -d "$TARGET_DIR" ]; then
    BACKUP_NAME="app-interface.backup.$(date +%s)"
    echo "💾 Backing up existing app-interface to $BACKUP_NAME"
    cd "$MONOREPO_DIR"
    mv app-interface "$BACKUP_NAME"
    echo "   Backup created at: $BACKUP_NAME"
fi

# Step 3: Copy files
echo "📋 Copying files from $SOURCE_DIR to $TARGET_DIR..."
cp -r "$SOURCE_DIR" "$TARGET_DIR"

# Step 4: Remove git history
echo "🧹 Removing git history..."
rm -rf "$TARGET_DIR/.git"
rm -f "$TARGET_DIR/.gitignore"  # We'll use monorepo root .gitignore

# Step 5: Update package.json name
echo "✏️  Updating package.json..."
cd "$TARGET_DIR"
sed -i '' 's/"name": "web3-ui-starter-pack"/"name": "@spout\/app-interface"/' package.json

# Step 6: Show what needs to be done next
echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. cd $MONOREPO_DIR"
echo "2. Review changes: git status"
echo "3. Add files: git add app-interface/"
echo "4. Commit: git commit -m 'feat: integrate app-interface Solana changes'"
echo "5. Push: git push"
echo ""
echo "To test the migrated app:"
echo "  cd $MONOREPO_DIR/app-interface"
echo "  npm install"
echo "  npm run dev"

