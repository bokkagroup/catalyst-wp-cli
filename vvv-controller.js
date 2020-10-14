'use strict';
const Project = require('./Project');
const fs = require('extfs');
const handlebars = require('handlebars');
const yaml = require("node-yaml");

class Controller extends Project {

    constructor(project_name)
    {
        super(project_name);
        this.config = this.getVVVConfig();
        this.project_dir = process.env['HOME'] + '/vagrants/www/' + this.project_name;
    }

    addHost(hostname)
    {
        this.config.then((data)=>{
            data.sites[this.project_name].hosts.push(hostname);
            this.saveConfig(data).then(()=>{ console.log("Enabled Install".green); });
        });
    }

    _create(configs)
    {
        this.createProjectConfigs(configs);
        this.enableInstall();
    }

    _delete()
    {
        console.log("Custom Delete code");
    }

    _addDomain()
    {

    }

    createProjectDirectory()
    {
        this.createDirectory(
            [
                ['project',     this.project_dir],
                ['htdocs',      this.project_dir + '/htdocs'],
                ['provision',   this.project_dir + '/provision'],
            ]
        );

        global.catalystBaseDir = this.project_dir + '/htdocs';
    }

    createDirectory(array)
    {
        array.forEach((item) => {
            if (!fs.existsSync(item[1])) {
                fs.mkdirSync(item[1]);
            } else {
                console.warn('Skipping: '+ item[0]+' already exists.'.yellow);
            }
        });
    }


    createProjectConfigs(configs)
    {
        /**
         * Create Virtual host configs
         */
        const virtual_templates = {
            //human friendly template name: [path to send file, name of template file w/o extension]
            virtualhost : [this.project_dir + '/provision/vvv-nginx.conf', 'nginx-conf'],
            initialize  : [this.project_dir + '/provision/vvv-init.sh', 'init-conf']
        };

        Object.keys(virtual_templates)
            .forEach(function (key) {
                    const value = virtual_templates[key]
                    if (!fs.existsSync(value[0])) {
                        const template = handlebars.compile(fs.readFileSync(__dirname + '/templates/' + value[1] + '.hbs').toString('utf-8'));
                        fs.writeFileSync(value[0], template(configs));
                    } else {
                        console.warn(('Skipping: ' + key + ' template already exists.').yellow);
                    }

                }
            );
    }

    getVVVConfig()
    {
        return new Promise((resolve, reject)=>{
            yaml.read(process.env['HOME'] + '/vagrants/config/config.yml',{
                encoding: "utf8",
                schema: yaml.schema.defaultSafe
            }, function(err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }

    saveVVVConfig(data)
    {
        return new Promise((resolve,reject)=> {
            yaml.write(process.env['HOME'] + '/vagrants/config/config.yml', data, {
                encoding: "utf8",
                schema: yaml.schema.defaultSafe
            }, function(err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    enableInstall()
    {
        this.config.then((data)=>{
            data.sites[this.project_name] = {
                hosts: [this.project_name + '.test']
            };

            this.saveVVVConfig(data).then(()=>{ console.log("Enabled Install".green); });
        });
    }
}

module.exports = Controller;
