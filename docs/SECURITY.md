const limiter = rateLimit({
windowMs: 15 _ 60 _ 1000, // 15 minutes
max: 100, // limit each IP to 100 requests per windowMs
standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
legacyHeaders: false, // Disable the `X-RateLimit-*` headers
message: {
status: 'error',
message: 'Too many requests, please try again later.',
type: 'rate_limit_exceeded',
},
});
