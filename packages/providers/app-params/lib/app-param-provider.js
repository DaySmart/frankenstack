"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppParamsProvider = void 0;
const aws_sdk_1 = require("aws-sdk");
const Provider_1 = require("@daysmart/frankenstack-base-provider/assets/Provider");
class AppParamsProvider extends Provider_1.Provider {
    async provisionComponent() {
        let client = new aws_sdk_1.SSM();
        try {
            const paramName = `${this.environment}-${this.componentName}`;
            const resp = await client.putParameter({
                Name: paramName,
                Value: JSON.stringify(Object.assign({}, ...this.inputs.map(input => { return { [input.Key]: input.Value }; }))),
                Type: 'SecureString',
                Overwrite: true
            }).promise();
            console.log(resp);
            this.outputs.push({
                Key: 'APP_PARAMETERS',
                Value: paramName
            });
            this.result = true;
        }
        catch (err) {
            console.error(err);
        }
    }
}
exports.AppParamsProvider = AppParamsProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXBhcmFtLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXBhcmFtLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUE4QjtBQUM5QixtRkFBZ0Y7QUFFaEYsTUFBYSxpQkFBa0IsU0FBUSxtQkFBUTtJQUMzQyxLQUFLLENBQUMsa0JBQWtCO1FBQ3BCLElBQUksTUFBTSxHQUFHLElBQUksYUFBRyxFQUFFLENBQUM7UUFFdkIsSUFBSTtZQUNBLE1BQU0sU0FBUyxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDOUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDO2dCQUNuQyxJQUFJLEVBQUUsU0FBUztnQkFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUUsT0FBTyxFQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUMsQ0FBQSxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLElBQUksRUFBRSxjQUFjO2dCQUNwQixTQUFTLEVBQUUsSUFBSTthQUNsQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFYixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWxCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNkLEdBQUcsRUFBRSxnQkFBZ0I7Z0JBQ3JCLEtBQUssRUFBRSxTQUFTO2FBQ25CLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ3RCO1FBQUMsT0FBTSxHQUFHLEVBQUU7WUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RCO0lBQ0wsQ0FBQztDQUNKO0FBekJELDhDQXlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNTTSB9IGZyb20gJ2F3cy1zZGsnO1xyXG5pbXBvcnQgeyBQcm92aWRlciB9IGZyb20gXCJAZGF5c21hcnQvZnJhbmtlbnN0YWNrLWJhc2UtcHJvdmlkZXIvYXNzZXRzL1Byb3ZpZGVyXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQXBwUGFyYW1zUHJvdmlkZXIgZXh0ZW5kcyBQcm92aWRlciB7XHJcbiAgICBhc3luYyBwcm92aXNpb25Db21wb25lbnQoKSB7XHJcbiAgICAgICAgbGV0IGNsaWVudCA9IG5ldyBTU00oKTtcclxuICAgICAgICBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgJHt0aGlzLmVudmlyb25tZW50fS0ke3RoaXMuY29tcG9uZW50TmFtZX1gO1xyXG4gICAgICAgICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnB1dFBhcmFtZXRlcih7XHJcbiAgICAgICAgICAgICAgICBOYW1lOiBwYXJhbU5hbWUsXHJcbiAgICAgICAgICAgICAgICBWYWx1ZTogSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmFzc2lnbih7fSwgLi4udGhpcy5pbnB1dHMubWFwKGlucHV0ID0+IHtyZXR1cm4ge1tpbnB1dC5LZXldOiBpbnB1dC5WYWx1ZX19KSkpLFxyXG4gICAgICAgICAgICAgICAgVHlwZTogJ1NlY3VyZVN0cmluZycsXHJcbiAgICAgICAgICAgICAgICBPdmVyd3JpdGU6IHRydWVcclxuICAgICAgICAgICAgfSkucHJvbWlzZSgpO1xyXG4gICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5vdXRwdXRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgS2V5OiAnQVBQX1BBUkFNRVRFUlMnLFxyXG4gICAgICAgICAgICAgICAgVmFsdWU6IHBhcmFtTmFtZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVzdWx0ID0gdHJ1ZTtcclxuICAgICAgICB9IGNhdGNoKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19