const flatten = require('flat');

export function resolveComponents(template: any, params: any): any {
    template.components = template.components.map((component: any) => {
        if(component.provider.config) {
            component.provider.config = Object.entries(component.provider.config).map(([key, value]) => {
                return {
                    name: key,
                    value: value
                }
            })
        }
        if(component.inputs) {
            component.inputs = flatten(component.inputs);
            component.inputs = Object.entries(component.inputs).map(([key, value]) => {
                return {
                    name: key,
                    value: typeof value === 'string' ? resolveInputVariables(value, template, params) : value
                }
            })
        }
        return component;
    });
    return template;
}

export function resolveInputVariables(rawValue: string, template: any, params: any): string {
    const variablePattern = new RegExp(/(\$\{([^${}]*?)\})+/);
    let match = variablePattern.exec(rawValue);
    while(match) {
        const matchValue = match[2];
        const currentIndex = match.index + rawValue.indexOf(match.input);
        const replaceValue = resolveReference(matchValue, template, params);
        if(matchValue === replaceValue) {
            match = variablePattern.exec(rawValue.substring(currentIndex + matchValue[1].length));
        } else {
            rawValue = rawValue.replace(match[1], replaceValue);
            match = variablePattern.exec(rawValue);
        }
    }
    return rawValue;
}

function resolveReference(reference: string, template: any, params: any): string {
    let type = reference.split(':')[0];
    let resolvedRef = reference;
    switch(type) {
        case 'self':
            const property = reference.replace('self:', '');
            if(template[property]) {
                resolvedRef = template[property];
            } else {
                throw `Could not resolve reference: ${reference}`;
            }
            break;
        case 'param':
        case 'params':
            const param = reference.replace(`${type}:`, '');
            if(params[param]) {
                resolvedRef = params[param];
            } else {
                throw `Could not resolve reference: ${reference}`
            }
            break;
        default:
            break;
    }
    return resolvedRef;
}