import React, { useState } from 'react';
import Form, { FormField } from './Form';
import FormGroup from './FormGroup';
import TextInput from './TextInput';
import Select from './Select';
import Checkbox from './Checkbox';
import RadioButton, { RadioGroup } from './RadioButton';
import Button from './Button';

const FormDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('basic');

  // Demo 1: Basic Form
  const BasicFormDemo = () => {
    const validation = {
      name: {
        required: true,
        minLength: 2,
        requiredMessage: 'Name is required',
        minLengthMessage: 'Name must be at least 2 characters'
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        requiredMessage: 'Email is required',
        patternMessage: 'Please enter a valid email address'
      },
      age: {
        required: true,
        custom: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 18 || num > 100) {
            return 'Age must be between 18 and 100';
          }
          return true;
        }
      }
    };

    const handleSubmit = async (values) => {
      console.log('Form submitted:', values);
      alert('Form submitted successfully!');
    };

    return (
      <Form
        validation={validation}
        onSubmit={handleSubmit}
        submitButtonText="Submit Basic Form"
      >
        <FormField name="name">
          <TextInput
            label="Full Name"
            placeholder="Enter your full name"
            required
          />
        </FormField>

        <FormField name="email">
          <TextInput
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            required
          />
        </FormField>

        <FormField name="age">
          <TextInput
            type="number"
            label="Age"
            placeholder="Enter your age"
            required
          />
        </FormField>
      </Form>
    );
  };

  // Demo 2: Advanced Form with all components
  const AdvancedFormDemo = () => {
    const [formData, setFormData] = useState({
      difficulty: 'medium',
      notifications: true,
      learningStyle: 'visual'
    });

    const difficultyOptions = [
      { value: 'easy', label: 'Easy', description: 'Basic vocabulary for beginners' },
      { value: 'medium', label: 'Medium', description: 'Intermediate level words' },
      { value: 'hard', label: 'Hard', description: 'Advanced SAT vocabulary' }
    ];

    const learningStyleOptions = [
      { value: 'visual', label: 'Visual Learning' },
      { value: 'auditory', label: 'Auditory Learning' },
      { value: 'kinesthetic', label: 'Hands-on Learning' }
    ];

    const validation = {
      username: {
        required: true,
        minLength: 3,
        pattern: /^[a-zA-Z0-9_]+$/,
        patternMessage: 'Username can only contain letters, numbers, and underscores'
      },
      password: {
        required: true,
        minLength: 8,
        custom: (value) => {
          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
          }
          return true;
        }
      },
      confirmPassword: {
        required: true,
        custom: (value, allValues) => {
          if (value !== allValues.password) {
            return 'Passwords do not match';
          }
          return true;
        }
      }
    };

    const handleSubmit = async (values) => {
      console.log('Advanced form submitted:', values);
      alert('Registration successful!');
    };

    return (
      <Form
        validation={validation}
        onSubmit={handleSubmit}
        submitButtonText="Create Account"
        layout="vertical"
      >
        <FormGroup label="Account Information">
          <FormField name="username">
            <TextInput
              label="Username"
              placeholder="Choose a username"
              required
              startIcon="👤"
            />
          </FormField>

          <FormField name="password">
            <TextInput
              type="password"
              label="Password"
              placeholder="Create a strong password"
              required
              helperText="Must be at least 8 characters with uppercase, lowercase, and number"
            />
          </FormField>

          <FormField name="confirmPassword">
            <TextInput
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              required
            />
          </FormField>
        </FormGroup>

        <FormGroup label="Learning Preferences">
          <FormField name="difficulty">
            <Select
              label="Difficulty Level"
              options={difficultyOptions}
              searchable
              helperText="Choose your preferred difficulty level"
            />
          </FormField>

          <RadioGroup
            name="learningStyle"
            label="Learning Style"
            options={learningStyleOptions}
            value={formData.learningStyle}
            onChange={(value) => setFormData(prev => ({ ...prev, learningStyle: value }))}
            direction="column"
          />
        </FormGroup>

        <FormGroup label="Notifications">
          <Checkbox
            label="Email notifications"
            checked={formData.notifications}
            onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
            helperText="Receive updates about your learning progress"
          />

          <Checkbox
            label="SMS reminders"
            helperText="Get text reminders for your daily learning goals"
          />

          <Checkbox
            label="Weekly progress reports"
            helperText="Receive detailed progress summaries every week"
          />
        </FormGroup>
      </Form>
    );
  };

  // Demo 3: Inline Form
  const InlineFormDemo = () => (
    <Form layout="inline" submitButtonText="Search">
      <FormField name="search">
        <TextInput
          placeholder="Search vocabulary..."
          startIcon="🔍"
        />
      </FormField>

      <FormField name="category">
        <Select
          placeholder="Category"
          options={[
            { value: 'all', label: 'All Categories' },
            { value: 'nouns', label: 'Nouns' },
            { value: 'verbs', label: 'Verbs' },
            { value: 'adjectives', label: 'Adjectives' }
          ]}
        />
      </FormField>
    </Form>
  );

  const demos = [
    { id: 'basic', title: 'Basic Form', component: BasicFormDemo },
    { id: 'advanced', title: 'Advanced Form', component: AdvancedFormDemo },
    { id: 'inline', title: 'Inline Form', component: InlineFormDemo }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Form Components Demo</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {demos.map(demo => (
            <Button
              key={demo.id}
              variant={selectedDemo === demo.id ? 'primary' : 'secondary'}
              onClick={() => setSelectedDemo(demo.id)}
            >
              {demo.title}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        {demos.find(demo => demo.id === selectedDemo)?.component()}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
        <h3>Form Components Features:</h3>
        <ul>
          <li><strong>TextInput:</strong> Various types, validation, icons, sizes</li>
          <li><strong>Select:</strong> Searchable, multiple selection, custom options</li>
          <li><strong>Checkbox:</strong> Individual or groups, indeterminate state</li>
          <li><strong>RadioButton:</strong> Single or group selection</li>
          <li><strong>FormGroup:</strong> Organized field grouping with labels</li>
          <li><strong>Form:</strong> Complete validation, submission handling</li>
          <li><strong>Responsive:</strong> Adapts to different screen sizes</li>
          <li><strong>Accessible:</strong> ARIA labels, keyboard navigation</li>
          <li><strong>Dark Mode:</strong> Automatic theme support</li>
        </ul>
      </div>
    </div>
  );
};

export default FormDemo;
