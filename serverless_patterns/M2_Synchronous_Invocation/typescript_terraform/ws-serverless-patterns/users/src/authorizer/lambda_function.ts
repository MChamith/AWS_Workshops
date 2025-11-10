// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// *** Section 1 : base setup and token validation helper function
isColdStart = true
keys = {}
userPoolId = process.env.USER_POOL_ID
appClientId = process.env.APPLICATION_CLIENT_ID
adminGroupName = process.env.ADMIN_GROUP_NAME

const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

async function validate_token(token, region) {
  // KEYS URL -- REPLACE WHEN CHANGING IDENTITY PROVIDER
  const keysUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
  var keys

  isColdStart = true
  if (isColdStart) {
    const response = await axios.get(keysUrl)
    keys = response.data.keys
  }
  // get the kid from the headers prior to verification
  decodedJwt = jwt.decode(token, { complete: true });
  const { kid } = decodedJwt.header;
  const { iss, sub } = decodedJwt.payload;

  // search for the kid in the downloaded public keys
  keyIndex = -1
  for (i=0; i < keys.length; i++) {
    key = keys[i]
    if (kid == key.kid){
        keyIndex = i
        break
    }
  }

  if (keyIndex == -1){
      console.log("Public key not found in jwks.json")
      return false
  }

  // Retrieve payload
  claims = decodedJwt.payload 

  // Verify the token expiration
  const expLength = 13
  expStr = claims['exp'].toString().padEnd(expLength,'0')
  currentTimeStr = Date.now().toString().padEnd(expLength,'0')
  exp = Number(expStr)
  currentTime = Number(currentTimeStr)
  if (currentTime > exp) {
    console.log("Token is expired")
    return false
  }

  // Verify the Audience  (use claims['client_id'] if verifying an access token)
  if (claims['aud'] != appClientId) {
    console.log("Token was not issued for this audience")
    return false
  }

  // verify the signature
  cert = jwkToPem(keys[keyIndex]);
  decodedJwt = await jwt.verify(token, key=cert, { algorithms: ['RS256'] })

  console.log("Signature successfully verified")
  return decodedJwt
}

exports.lambda_handler = async (event, context, callback) => {
  tmp = event["methodArn"].split(':');
  apiGatewayArnTmp = tmp[5].split('/');
  region = tmp[3];
  awsAccountId = tmp[4];
  // validate the incoming token
  validatedDecodedToken = await validate_token(event.authorizationToken, region)
  if (! validatedDecodedToken) {
    callback('Unauthorized')
  }
  principalId = validatedDecodedToken['sub']
  // initialize the policy
  policy = new AuthPolicy(principalId, awsAccountId);
  policy.restApiId = apiGatewayArnTmp[0];
  policy.region = region;
  policy.stage = apiGatewayArnTmp[1];

  // *** Section 2 : authorization rules
  // Allow all public resources/methods explicitly

  policy.allowMethod(HttpVerb.GET, `/users/${principalId}`)
  policy.allowMethod(HttpVerb.PUT, `/users/${principalId}`)
  policy.allowMethod(HttpVerb.DELETE, `/users/${principalId}`)
  policy.allowMethod(HttpVerb.GET, `/users/${principalId}/*`)
  policy.allowMethod(HttpVerb.PUT, `/users/${principalId}/*`)
  policy.allowMethod(HttpVerb.DELETE, `/users/${principalId}/*`)

  // Look for admin group in Cognito groups
  // Assumption: admin group always has higher precedence
  if ("cognito:groups" in validatedDecodedToken && validatedDecodedToken['cognito:groups'][0] == adminGroupName) {
      // add administrative privileges
      policy.allowMethod(HttpVerb.GET, "users")
      policy.allowMethod(HttpVerb.GET, "users/*")
      policy.allowMethod(HttpVerb.DELETE, "users")
      policy.allowMethod(HttpVerb.DELETE, "users/*")
      policy.allowMethod(HttpVerb.POST, "users")
      policy.allowMethod(HttpVerb.PUT, "users/*")
  }

  // Finally, build the policy
  authResponse = policy.build();
  return authResponse;
}

class HttpVerb {
  static GET = 'GET';
  static POST = 'POST';
  static PUT = 'PUT';
  static PATCH = 'PATCH';
  static HEAD = 'HEAD';
  static DELETE = 'DELETE';
  static OPTIONS = 'OPTIONS';
  static ALL = '*';
}

class AuthPolicy {
  // The AWS account id the policy will be generated for. This is used to create the method ARNs.
  awsAccountId = '';
  // The principal used for the policy, this should be a unique identifier for the end user.
  principalId = '';
  // The policy version used for the evaluation. This should always be '2012-10-17'
  version = '2012-10-17';
  // The regular expression used to validate resource paths for the policy
  pathRegex = '^[/.a-zA-Z0-9-\*]+$';

  /*Internal lists of allowed and denied methods.
    These are lists of objects and each object has 2 properties: A resource
    ARN and a nullable conditions statement. The build method processes these
    lists and generates the approriate statements for the final policy.*/      
  allowMethods = [];
  denyMethods = [];

  /* Replace the placeholder value with a default API Gateway API id to be used in the policy.
  Beware of using '*' since it will not simply mean any API Gateway API id, because stars will greedily expand over '/' or other separators.
  See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details. */
  restApiId = '<<restApiId>>';

  /* Replace the placeholder value with a default region to be used in the policy.
  Beware of using '*' since it will not simply mean any region, because stars will greedily expand over '/' or other separators.
  See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details. */
  region = '<<region>>';

  /* Replace the placeholder value with a default stage to be used in the policy.
  Beware of using '*' since it will not simply mean any stage, because stars will greedily expand over '/' or other separators.
  See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details. */
  stage = '<<stage>>';

  constructor(principal, awsAccountId) {
      this.awsAccountId = awsAccountId;
      this.principalId = principal;
      this.allowMethods = [];
      this.denyMethods = [];
  }

  addMethod(effect, verb, resource, conditions) {
    /* Adds a method to the internal lists of allowed or denied methods. Each object in
    the internal list contains a resource ARN and a condition statement. The condition
    statement can be null. */
    if (verb != '*' && !(HttpVerb.hasOwnProperty(verb))) {
        throw Error("Invalid HTTP verb ' + verb + '. Allowed verbs in HttpVerb class");
    }
    //re = new RegExp(this.pathRegex);
    //resourcePattern = re.compile(this.pathRegex);
    if (!resource.match(this.pathRegex)) {
        throw Error('Invalid resource path: ' + resource + '. Path should match ' + this.pathRegex);
    }
    if (resource.substring(0,1) == '/') {
        resource = resource.substring(1);
    }
    var resourceArn = `arn:aws:execute-api:${this.region}:${this.awsAccountId}:${this.restApiId}/${this.stage}/${verb}/${resource}`;
    if (effect.toLowerCase() == 'allow') {
      this.allowMethods.push({
        'resourceArn': resourceArn,
        'conditions': conditions
      });
    } else if (effect.toLowerCase() == 'deny') {
        this.denyMethods.push({
          'resourceArn': resourceArn,
          'conditions': conditions
        });
    }
  }
  getEmptyStatement(effect) {
    /* Returns an empty statement object prepopulated with the correct action and the
    desired effect. */
    var statement = {
        'Action': 'execute-api:Invoke',
        'Effect': effect.substring(0,1).toUpperCase() + effect.substring(1).toLowerCase(),
        'Resource': []
    };
    return statement;
  }
  getStatementForEffect(effect, methods) {
    /* This function loops over an array of objects containing a resourceArn and
    conditions statement and generates the array of statements for the policy. */
    var statements = [];
    var statement = [];

    for (var curMethodIdx in methods) {
      var curMethod = methods[curMethodIdx];
      if (curMethod['conditions'] === null || curMethod['conditions'].length == 0) {
        statement = this.getEmptyStatement(effect);
        statement['Resource'].push(curMethod['resourceArn']);
        statements.push(statement);
      } else {
        conditionalStatement = this.getEmptyStatement(effect);
        conditionalStatement['Resource'].push(curMethod['resourceArn']);
        conditionalStatement['Condition'].push(curMethod['conditions']);
        statements.push(conditionalStatement);
      }
    }
    return statements;
  }
  allowAllMethods() {
    //Adds a '*' allow to the policy to authorize access to all methods of an API
    this.addMethod('Allow', HttpVerb.ALL, '*', []);
  }
  denyAllMethods() {
    //Adds a '*' allow to the policy to deny access to all methods of an API
    this.addMethod('Deny', HttpVerb.ALL, '*', []);
  }
  allowMethod(verb, resource) {
    /*Adds an API Gateway method (Http verb + Resource path) to the list of allowed\
    methods for the policy';*/
    this.addMethod('Allow', verb, resource, []);
  }
  denyMethod(verb, resource) {
    /*Adds an API Gateway method (Http verb + Resource path) to the list of denied\n' +
    methods for the policy*/
    this.addMethod('Deny', verb, resource, []);
  }
  allowMethodWithConditions(verb, resource, conditions) {
    /*Adds an API Gateway method (Http verb + Resource path) to the list of allowed
    methods and includes a condition for the policy statement. More on AWS policy
    conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
    this.addMethod('Allow', verb, resource, conditions)*/
  }
  denyMethodWithConditions(verb, resource, conditions) {
    /*Adds an API Gateway method (Http verb + Resource path) to the list of denied
    methods and includes a condition for the policy statement. More on AWS policy
    conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
    this.addMethod('Deny', verb, resource, conditions)*/
  }
  build() {
    /*Generates the policy document based on the internal lists of allowed and denied
    conditions. This will generate a policy with two main statements for the effect:
    one statement for Allow and one statement for Deny.
    Methods that includes conditions will have their own statement in the policy.*/
    if ((this.allowMethods === null || this.allowMethods.length == 0) &&
      (this.denyMethods === null || this.denyMethods.length == 0)) {
      throw Error('No statements defined for the policy');
    }
    var policy = {
        'principalId': this.principalId,
        'policyDocument': {
            'Version': this.version,
            'Statement': []
        }
    };

    var allowMethodsStatement = this.getStatementForEffect('Allow', this.allowMethods)
    var denyMethodsStatement = this.getStatementForEffect('Deny', this.denyMethods)
    var allMethodsStatement = allowMethodsStatement.concat(denyMethodsStatement);

    if (allMethodsStatement != null) {
      policy['policyDocument']['Statement'] = allMethodsStatement;
    }
    console.log(JSON.stringify(policy))
    return policy;
  }
}
