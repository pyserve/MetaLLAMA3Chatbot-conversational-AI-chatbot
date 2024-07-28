
class SimpleCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(request.COOKIES)
        response = self.get_response(request)
        origin = request.headers.get('Origin')
        if origin:
            allowed_origin = 'http://localhost:3000'
            if origin == allowed_origin:
                response["Access-Control-Allow-Origin"] = origin
                response["Access-Control-Allow-Credentials"] = "true"
                response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
                response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
        return response
    