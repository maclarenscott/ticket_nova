import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import AuthContext, { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Checking authentication state in RegisterPage:', isAuthenticated());
    if (isAuthenticated()) {
      console.log('User is authenticated, redirecting to home');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Validation schema
  const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required')
  });

  // Handle form submission
  const handleSubmit = async (
    values: RegisterFormValues,
    { setSubmitting, resetForm }: FormikHelpers<RegisterFormValues>
  ) => {
    console.log('Register form submitted with email:', values.email);
    setFormError(null);
    
    try {
      await register(values.firstName, values.lastName, values.email, values.password);
      console.log('Registration successful, redirecting...');
      
      // Explicitly redirect after successful registration
      if (isAuthenticated()) {
        navigate('/');
      }
    } catch (err) {
      console.error('Register form error:', err);
      // Error handling is done in the context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {(error || formError) && <div className="error-message">{error || formError}</div>}
        
        <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <Field type="text" name="firstName" className="form-control" />
                <ErrorMessage name="firstName" component="div" className="error-text" />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <Field type="text" name="lastName" className="form-control" />
                <ErrorMessage name="lastName" component="div" className="error-text" />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Field type="email" name="email" className="form-control" />
                <ErrorMessage name="email" component="div" className="error-text" />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <Field type="password" name="password" className="form-control" />
                <ErrorMessage name="password" component="div" className="error-text" />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Field type="password" name="confirmPassword" className="form-control" />
                <ErrorMessage name="confirmPassword" component="div" className="error-text" />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? 'Creating Account...' : 'Register'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-links">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 