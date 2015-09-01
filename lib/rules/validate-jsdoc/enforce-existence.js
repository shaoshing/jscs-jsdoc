module.exports = enforceExistence;
module.exports.scopes = ['function'];
module.exports.options = {
    enforceExistence: {allowedValues: [true, 'exceptExports']}
};

/**
 * Validator for jsdoc data existance
 *
 * @param {(FunctionDeclaration|FunctionExpression)} node
 * @param {Function} err
 */
function enforceExistence(node, err) {
    var reportExports = this._options.enforceExistence !== 'exceptExports';

    // if function is not anonymous or in variabledeclarator or in assignmentexpression
    var parentNode = node.parentNode || {};
    var needCheck = node.id ||
        parentNode.type === 'VariableDeclarator' ||
        parentNode.type === 'Property' ||
        parentNode.type === 'AssignmentExpression' && parentNode.operator === '=';

    if (!reportExports && needCheck && parentNode.type === 'AssignmentExpression') {
        var left = parentNode.left;
        if ((left.object && left.object.name) === 'module' &&
            (left.property && left.property.name) === 'exports') {
            needCheck = false;
        }
    }
    
    // skip unless jsdoc exists and check is needed
    if (node.jsdoc || !needCheck) {
        return;
    }
    
    var functionName = _getFunctionName(node),
        exclusions = this._options.enforceExistenceExcept || [];
    
    if (functionName) {
        if(exclusions.indexOf(functionName) !== -1) {
            if (this._options.verbose) {
                console.log("jsdoc: Excluded:", functionName);
            }
            return;
        }
        
        var parentHasJsDoc = false,
            parentIsExcluded = false,
            parent = node.parentNode,
            parentFunctionName;
            
        while(parent){
            if (parent.jsdoc) {
                parentHasJsDoc = true;
                break;
            }
            
            parentFunctionName = _getFunctionName(parent);
            if(parentFunctionName && exclusions.indexOf(parentFunctionName) !== -1){
                parentIsExcluded = true;
                break;
            }
            
            parent = parent.parentNode;
        }
        
        if (parentHasJsDoc || parentIsExcluded) {            
            if (this._options.verbose) {
                console.log("jsdoc: Parent", parentHasJsDoc ? "has JsDoc" : "is excluded", ":", 
                    parentFunctionName, "->", functionName);
            }
            return;
        }
    }
    
    // report absence
    err('jsdoc definition required', node.loc.start);
}

function _getFunctionName(node) {
    var parent = node.parentNode;
    
    while (parent) {
        switch (parent.type) {
            case "VariableDeclarator":
                return parent.id.name;
            case "Property":
                return parent.key.name;
        }
        parent = parent.parentNode;
    }
    
    return null;
}
