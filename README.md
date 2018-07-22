# planned flow

* ts-scaffolder <ProjectName> [--web] [--umdModule myModuleName]
* if is npm module name: create folder <ProjectName.toLowerCase()>
* run npm init -y in <ProjectName>, extend package.json with .scripts and install ts-scaffolder-scripts as devDependency
* copy ./template/* into <ProjectName> replacing all placeholders with real values