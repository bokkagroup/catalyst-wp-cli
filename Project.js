'use strict';
const handlebars = require('handlebars');
const inquirer = require('inquirer');
const fs = require('extfs');
const pem = require('pem');
const git = require('simple-git/promise');
const exec = require('child_process').exec;
require('colors');

class Project {

    constructor(project_name)
    {
        this.project_name = project_name;
    }

    /**
     * Creates a new Catalyst WP project, triggers vendor controller _create.
     */
    create() {

        if(!this.assertValidProjectName(this.project_name)){
            console.log("Aborting: Invalid Sitename".bgRed.white);
            process.exit(1);
        }

        console.log(('Creating new local install: ' + this.project_name).green);

        const questions = [
            {
                type: 'confirm',
                name: 'ssl',
                message: 'SSL(y):',
                default: true
            },
            {
                type: 'confirm',
                name: 'multisite',
                message: 'Multisite(n):',
                default: false
            },
            {
                type: 'input',
                name: 'upstream',
                message: 'Upstream git repo?',
                default: 'git@github.com:bokkagroup/catalyst-wp-boilerplate.git',
                validate: function (value) {
                    const pass = value.match(/((git|ssh|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:/\-~]+)(\.git)(\/)?/i);
                    if (pass) {
                        return true;
                    }

                    return 'Please enter a valid git repo url';
                }
            }
        ];

        inquirer.prompt(questions).then((answers) => {

            answers.project_name = this.project_name;
            console.log('Setting up project directories...'.green);
            this.createProjectDirectory();
            this.setupGitRepo().then(() => {
                return this.setupChildTheme();
            }).then(() => {
                return this.composerInstall();
            }).then(() => {
                this.addWordpressConfig(answers);
                this._create(answers);
                this.addConfig();
            }).catch((error)=>{
                console.error(error);
                this.delete();
                process.exit(1);
            });
        });

    }

    /**
     * Sets up a Catalyst wp config file.
     */
    addConfig()
    {
        const filepath = global.catalystBaseDir + '/catalyst-wp.json'
        if (!fs.existsSync(filepath)) {
            console.log("Creating Catalyst Config file...");
            const template = handlebars.compile(fs.readFileSync(__dirname + '/templates/catalyst-config.hbs').toString('utf-8'));
            fs.writeFileSync(filepath, template());
        } else {
            console.warn(('Skipping: a configuration already exists for this site.').yellow);
        }
    }

    /**
     * Clones the CatalystWP boilerplate
     */
    setupGitRepo()
    {
        if (!fs.isEmptySync(global.catalystBaseDir)) {
            console.error(('Error: Directory is not empty cannot git clone (' +  global.catalystBaseDir + ')').red);
            process.exit(1);
        }


        return new Promise(function(resolve, reject) {
            // do a thing, possibly async, then…
            console.log('Cloning Catalyst WP...'.green);
            git(global.catalystBaseDir).clone('git@github.com:bokkagroup/catalyst-wp-boilerplate.git', global.catalystBaseDir)
                .then(()=>{
                    resolve('success');
                })
                .catch((err)=>{
                reject(err);
            });
        });
    }

    /**
     * Clones the child-theme and removes .git folder
     */
    setupChildTheme()
    {
        const filepath = global.catalystBaseDir + '/wp-content/themes/atom-child';

        if(!fs.isEmptySync(filepath)){
            console.error('Warning: Directory is not empty cannot git clone ('+ filepath +')');
        }

        return new Promise(function(resolve, reject) {
            console.log('Setting up child theme...'.green);
            git(global.catalystBaseDir).clone('git@github.com:bokkagroup/atom-child.git', filepath)
                .then(()=>{
                    fs.removeSync(filepath + '/.git');
                    resolve();
                })
                .catch((err)=>{
                reject(err);
            });
        });
    }

    /**
     * Completely removes project, triggers vendor controller cleanup
     */
    delete()
    {
        if(!this.assertValidProjectName(this.project_name)){
            console.log("Aborting: Invalid Sitename".bgRed.white);
            process.exit(1);
        }

        console.log(('Deleting install: ' + this.project_name).green);

        const questions = [
            {
                type: 'confirm',
                name: 'delete_confirm',
                message: 'Are you sure you want to Delete? (y/n):',
                default: true
            },
        ];

        inquirer.prompt(questions).then((answers) => {
            if(answers.delete_confirm) {
                this._delete();
            } else {
                console.log("Don't worry we won't delete anything".green);
            }
        });
    }


    addDomain(host_name)
    {
        this._addDomain(host_name);
    }

    /**
     * Install composr deps
     */
    composerInstall()
    {
        process.chdir(global.catalystBaseDir);
        console.log("Installing composer dependencies...".green)
        return new Promise((resolve, reject)=>{
            function puts(error, stdout, stderr) {
                if (error) {
                    console.error(stderr.red);
                    reject('Failed to install composer dependencies');
                } else {
                    console.log(stdout);
                    resolve('Success');
                }
            }
            exec("composer install", puts);
        });
    }

    /**
     * Creates a wp-config.php file
     * @param configs
     */
    addWordpressConfig(configs)
    {
        console.log("Creating wp-config.php...");
        const template = handlebars.compile(fs.readFileSync(__dirname + '/templates/wp-config.hbs').toString('utf-8'));
        fs.writeFileSync(global.catalystBaseDir + '/wp-config.php', template(configs));
    }

    /**
     * Asserts project name is lower-case alphanumeric no special characters
     * @param name
     * @returns {boolean}
     */
    assertValidProjectName(name)
    {
        if (!name.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
            return false;
        }
        return true;
    }
}

module.exports = Project;