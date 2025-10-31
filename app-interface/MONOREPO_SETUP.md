# Integrating app-interface into Monorepo

This guide will help you move your current `app-interface-solana` changes into the `SpoutSolana/spout-finance` monorepo structure.

## Option 1: Clone Monorepo and Copy Files (Recommended)

### Step 1: Clone the monorepo
```bash
cd /Users/paulvanmierlo
git clone https://github.com/SpoutSolana/spout-finance.git
cd spout-finance
```

### Step 2: Remove the existing app-interface folder (if it has old content)
```bash
# Check what's in it first
ls -la app-interface/

# If it has placeholder/old content, remove it
rm -rf app-interface/
```

### Step 3: Copy your current app-interface code
```bash
# Copy everything from your current project
cp -r ../app-interface-solana ./app-interface

# Remove git history from copied folder (we'll use monorepo's git)
cd app-interface
rm -rf .git
cd ..
```

### Step 4: Update package.json name
```bash
cd app-interface
# Edit package.json and change the name to match monorepo convention
# Change "name": "web3-ui-starter-pack" to "name": "@spout/app-interface" or "spout-app-interface"
```

### Step 5: Commit to monorepo
```bash
cd /Users/paulvanmierlo/spout-finance
git add app-interface/
git commit -m "feat: integrate app-interface Solana changes"
git push
```

## Option 2: Use Git Subtree or Submodule

If you want to keep the app-interface as a separate repository but reference it:

### As a Git Submodule
```bash
cd /Users/paulvanmierlo/spout-finance
git submodule add https://github.com/SpoutSolana/app-interface.git app-interface
git commit -m "feat: add app-interface as submodule"
```

### As a Git Subtree
```bash
cd /Users/paulvanmierlo/spout-finance
git subtree add --prefix=app-interface https://github.com/SpoutSolana/app-interface.git main --squash
```

## Option 3: Set Up Workspace Configuration

If you want to use npm/pnpm workspaces for better dependency management:

### For npm workspaces
Create/update `package.json` in the monorepo root:
```json
{
  "name": "spout-finance",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "app-interface",
    "backend-solana",
    "contracts"
  ],
  "scripts": {
    "dev:app": "npm run dev --workspace=app-interface",
    "build:app": "npm run build --workspace=app-interface",
    "dev:backend": "npm run dev --workspace=backend-solana"
  }
}
```

### For pnpm workspaces
Create `pnpm-workspace.yaml` in monorepo root:
```yaml
packages:
  - 'app-interface'
  - 'backend-solana'
  - 'contracts'
```

Then update root `package.json`:
```json
{
  "name": "spout-finance",
  "private": true,
  "scripts": {
    "dev:app": "pnpm --filter app-interface dev",
    "build:app": "pnpm --filter app-interface build"
  }
}
```

## Quick Migration Script

Here's a bash script to automate the migration:

```bash
#!/bin/bash
# migrate-to-monorepo.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

MONOREPO_DIR="/Users/paulvanmierlo/spout-finance"
SOURCE_DIR="/Users/paulvanmierlo/app-interface-solana"
TARGET_DIR="$MONOREPO_DIR/app-interface"

echo -e "${YELLOW}Migrating app-interface to monorepo...${NC}"

# Check if monorepo exists
if [ ! -d "$MONOREPO_DIR" ]; then
    echo "Cloning monorepo..."
    cd /Users/paulvanmierlo
    git clone https://github.com/SpoutSolana/spout-finance.git
fi

# Backup existing app-interface if it exists
if [ -d "$TARGET_DIR" ]; then
    echo "Backing up existing app-interface..."
    mv "$TARGET_DIR" "$TARGET_DIR.backup.$(date +%s)"
fi

# Copy files
echo "Copying files..."
cp -r "$SOURCE_DIR" "$TARGET_DIR"

# Remove git history
echo "Removing git history..."
rm -rf "$TARGET_DIR/.git"

# Update package.json name
echo "Updating package.json..."
cd "$TARGET_DIR"
sed -i '' 's/"name": "web3-ui-starter-pack"/"name": "@spout\/app-interface"/' package.json

echo -e "${GREEN}Migration complete!${NC}"
echo "Next steps:"
echo "1. cd $MONOREPO_DIR"
echo "2. Review the changes: git status"
echo "3. Commit: git add app-interface && git commit -m 'feat: integrate app-interface'"
echo "4. Push: git push"
```

Save this as `migrate-to-monorepo.sh`, make it executable with `chmod +x migrate-to-monorepo.sh`, and run it.

## Important Files to Check

After migration, verify these files are correct:

1. **package.json** - Update name to match monorepo convention
2. **tsconfig.json** - Path aliases might need adjustment
3. **next.config.js** - Ensure it works in the monorepo context
4. **.gitignore** - Should be compatible with monorepo root .gitignore
5. **README.md** - Update paths if they reference the old structure

## Recommended Monorepo Structure

```
spout-finance/
├── app-interface/          # Your Next.js frontend
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── package.json
├── backend-solana/         # Backend services
├── contracts/              # Solana programs
├── package.json            # Root workspace config
└── README.md               # Monorepo README
```

## After Migration

1. Test that everything still works:
   ```bash
   cd spout-finance/app-interface
   npm install
   npm run dev
   ```

2. Update any CI/CD workflows to use the new monorepo structure

3. Update documentation that references the old repository

4. Consider setting up Turborepo or Nx for better build orchestration if needed

