const fs = require('fs');
const handlebars = require('handlebars');

module.exports = class {

    constructor(className)
    {
        this.baseNameSpace = 'CatalystWP';
        this.themeNameSpace = 'AtomChild';

        if(className.includes('View')){
            this.generateClass(className.replace('View', ''), 'view');
        } else if(className.includes('Controller')){
            this.generateClass(className.replace('Controller', ''), 'controller');
        } else if(className.includes('Model')){
            this.generateClass(className.replace('Model', ''), 'model');
        } else if (!className.includes('models') && !className.includes('controllers') && !className.includes('views')) {
            this.generateResource(className);
        } else {
            console.error('Error: Invalid classname: '+ className);
        }
    }

    generateClass(className, type)
    {
        const upperClassName = className.charAt(0).toUpperCase() + className.slice(1);
        const content = { namespaces: [
            this.baseNameSpace,
            this.themeNameSpace,
            type,
            upperClassName
        ]};

        const template = this.generateTemplate(content, type);
        const filename = type !== 'model' ?
            upperClassName + ( type.charAt(0).toUpperCase() + type.slice(1)) + '.php' :
            upperClassName + '.php';
        const path = global.catalystBaseDir + '/wp-content/themes/atom-child/' + type + 's/' + filename;
        this.writeFile(path, template);

    }

    generateResource(className)
    {
        this.generateClass(className, 'model');
        this.generateClass(className, 'view');
        this.generateClass(className, 'controller');
    }


    generateTemplate(content, templateName)
    {
            const template = handlebars.compile(fs.readFileSync(__dirname + '/templates/'+ templateName + '.hbs').toString('utf-8'));
            return template(content);
    }

    writeFile(path, template)
    {
        if (!fs.existsSync(path)) {
            console.log("writing file...");
            fs.writeFileSync(path, template);
        } else {
            console.warn(('Skipping: file already exists: ' + path).yellow);
        }
    }
};