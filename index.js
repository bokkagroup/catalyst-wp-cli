#!/usr/bin/env node
'use strict';
const program = require('commander');
const Project = require('./vvv-controller');
const Generator = require('./generator');
const path = require('path');
const fs = require('extfs');
require('colors');

program
    .version('0.0.1')
    //project options
    .option('-c, --create <project_name>', 'Create new project environment - specify project name')
    .option('-D, --delete <project_name>', 'Delete project environment - specify project name')
    .option('-p, --project_name <project_name>', 'Specifies project name')
    .option('-d, --domain_name <domain_name>', 'A host name to be added to Project. Must be in Catalyst project directory or specify a project name.')

    //generator options
    .option('-g, --generate <resource_name>', 'Scaffolds new MVC classes for a project include class type in class name to generate individual classes (e.g. CarModel) or just the generic class name to generate all resources')
    .parse(process.argv);

console.log("                        ".white.bgCyan.bold);
console.log("  *------------------*  ".white.bgCyan.bold);
console.log("  ~~~ Catalyst WP ~~~   ".white.bgCyan.bold);
console.log("  *------------------*  ".white.bgCyan.bold);
console.log("                        ".white.bgCyan.bold);

class App {
    constructor(program)
    {
        this.setBaseDirectory(path.resolve("./"));

        if(program.create) {
            this.create(program.create);

        } else if (program.delete) {
            this.destroy(program.delete);

        } else if (program.domain_name) {

            if(!program.project_name && !assertCatalystSite()) {
                console.error('Please run command in a Catalyst WP Project directory or specify a project name with -p '.red);
                process.exit(1);
            } else {
                this.addDomain(program.domain_name, program.project_name);
            }

        } else if(program.generate) {
            this.generate(program.generate);

        } else {
            console.error('No command specified.'.yellow);
            process.exit(1);
        }
    }

    /**
     * Start a new project
     * @param host_name
     */
    create(host_name)
    {
        const project = new Project(host_name);
        project.create();
        return;
    }

    /**
     * Completely Remove a project and it's configuration
     * @param host_name
     */
    destroy(host_name)
    {
        const project = new Project(host_name);
        project.destroy();
        return;
    }

    /**
     * Adds a domain name to the configuration for a project
     * @param domain_name
     * @param project_name
     */
    addDomain(domain_name, project_name)
    {
        const project = new Project(project_name);
        project.addDomain(domain_name);
        return;
    }

    /**
     * Scaffold new MVC class files
     * @param className
     */
    generate(className)
    {
        const generator = new Generator(className);
        return;
    }

    /**
     * This is the base directory for Catalyst (may not always project base)
     * @param directory
     */
    setBaseDirectory(directory)
    {
        if(fs.existsSync(directory + '/catalyst-wp.json')) {
            global.catalystBaseDir = directory;
        } else if(directory !== '/') {
            this.setBaseDirectory(path.resolve(directory + '/..'));
        }
    }
}

new App(program);

function assertCatalystSite(){
    if(global.catalystBaseDir){
        return true;
    } else {
        return false;
    }
}