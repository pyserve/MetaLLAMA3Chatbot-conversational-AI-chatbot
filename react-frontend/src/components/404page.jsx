import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-75">
            <div className="text-center">
                <h1 className="display-1 text-danger">404</h1>
                <h2 className="mb-4">Oops! Page Not Found</h2>
                <p className="lead mb-5">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/" className="btn btn-danger btn-lg">
                    <i className='fa fa-arrow-left'></i> Go Back Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
