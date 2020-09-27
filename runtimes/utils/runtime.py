# Python executable wrapper for executing step functions in python (Requires python3.5+)
import argparse
import json
import importlib.util
import os
import sys
import base64


def main():
    parser = argparse.ArgumentParser(
        description='Serverless transport layer from JS to python')

    parser.add_argument('--location', help='Location to pass (Base 64 encoded)')
    parser.add_argument('--handler', help='Hanler string to pass (Base 64 encoded)')
    parser.add_argument('--environment', default={}, help='Env to pass (Base 64 encoded)')
    parser.add_argument('--event', help='Event Var To Pass (Base 64 encoded)')
    parser.add_argument('--context', help='Context Var To Pass (Base 64 encoded)')

    args = parser.parse_args()

    #Decode all base64 encoded args
    args = {key: base64.b64decode(value).decode() for (key, value) in vars(args).items() }
    print(args)
    # Setup file context to look to right place
    os.chdir(args['location'])

    # Load environment from context given by parent
    env = json.loads(args['environment'])
    os.environ = {**os.environ, **env}

    # Load handler into script context
    parts = args['handler'].split('.', 1)
    
    module_path = parts[0]
    module_function = parts[1]

    module_file = os.path.join(args['location'], f"{module_path}.py")

    if not os.path.isfile(module_file):
        raise FileNotFoundError(f"Unable to find handler at: {module_file}")
    
    # Build context for module
    spec = importlib.util.spec_from_file_location("module.name", module_file)
    handler = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(handler)

    # Pull in handler func
    handler_func = getattr(spec, module_function)

    event = json.loads(args['event'])
    context = json.loads(args['context'])

    res = handler_func(event, context)

    sys.stdout.write(json.dumps(res))
    sys.stdout.flush()

if __name__ == '__main__':
    main()
else:
    raise ImportError('Runtime cannot be executed as module!')
