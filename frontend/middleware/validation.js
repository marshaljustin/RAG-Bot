const { body } = require('express-validator');

exports.validateRegister = [
    body('email')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

exports.validateLogin = [
    body('email')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
];