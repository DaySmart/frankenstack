# Secrets Provider
Frankenstack provider for storing secrets in parameter store.

## Usage
```
env: my_env
components:
- name: my_component
  provider:
    name: secrets
  inputs:
    MY_SECRET: secret_value
    ANOTHER_SECRET: another_value
```
The values given would stored as parameters in parameter store as:
```
/my_env/my_component/MY_SECRET
/my_env/my_component/ANOTHER_SECRET
/my_env/my_component - for a json representation of all secrets in the component
```