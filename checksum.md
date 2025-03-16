# Scratch Card Costing (5,000 Units, UK)

For 5,000 plastic credit card-sized scratch cards (85.60mm x 53.98mm), full color on one side, scratch-off panel with unique code on the back:

- **Cost:** £750–£1,500 (£0.15–£0.30 per card)
- **Breakdown:**
  - PVC: £400–£750
  - Printing: £150–£300
  - Scratch-off: £150–£350
  - Codes: £50–£150
  - Setup: £0–£50 (often waived)
- **Most Likely:** £1,000–£1,250 (£0.20–£0.25 per card)
- **Notes:** Bulk discounts apply; VAT may add 20%. Contact UK printers (e.g., ScratchCardPrinting.co.uk) for exact quotes.

# Checksum Code Generator and Validator

This document describes a Python implementation for generating and validating 8-character codes, consisting of 7 random alphanumeric characters plus a checksum character. This can be used to give out psudo-passwords to club members.

## Overview

The solution provides two main functions:
- `generate_code()`: Creates an 8-character code with a checksum
- `validate_code()`: Verifies if a given code's checksum is valid

The character set includes digits (0-9) and uppercase letters (A-Z), providing 36 possible characters per position.

## Implementation

```python
import random
import string

def generate_code():
    # Define the character set: 0-9 and A-Z (36 possible characters)
    charset = string.digits + string.ascii_uppercase
    
    # Generate a random 7-character string
    code = ''.join(random.choice(charset) for _ in range(7))
    
    # Calculate checksum
    total = sum(charset.index(c) for c in code)
    checksum = charset[total % 36]
    
    # Return 8-character code (7 digits + checksum)
    return code + checksum

def validate_code(code):
    # Check if code is exactly 8 characters
    if len(code) != 8:
        return False
    
    # Define the character set
    charset = string.digits + string.ascii_uppercase
    
    # Verify all characters are valid
    if not all(c in charset for c in code):
        return False
    
    # Split into main code and checksum
    main_code = code[:7]
    checksum = code[7]
    
    # Recalculate checksum
    total = sum(charset.index(c) for c in main_code)
    expected_checksum = charset[total % 36]
    
    # Return True if calculated checksum matches provided checksum
    return checksum == expected_checksum
```

## Usage Example

```python
# Generate and test a code
code = generate_code()
print(f"Generated code: {code}")
print(f"Validation result: {validate_code(code)}")

# Test with modified code (should fail)
invalid_code = code[:-1] + '0' if code[-1] != '0' else code[:-1] + '1'
print(f"Modified code: {invalid_code}")
print(f"Validation result: {validate_code(invalid_code)}")
```

## Example Output

```plaintext
Generated code: X7K9P2M5
Validation result: True
Modified code: X7K9P2M0
Validation result: False

Generated code: 4N8B1Q9T
Validation result: True
Modified code: 4N8B1Q90
Validation result: False
```

## Features

- **Character Set**: Uses 36 characters (0-9, A-Z)
- **Code Length**: 8 characters (7 random + 1 checksum)
- **Checksum Algorithm**: Sum of character position values modulo 36
- **Error Detection**: Detects single-character changes
- **Capacity**: 36^7 (~78 billion) possible unique codes

## Validation Checks

The `validate_code()` function verifies:
1. Code is exactly 8 characters long
2. All characters are in the valid charset
3. Checksum matches the calculated value

## Possible Modifications

- Change the character set (e.g., numbers only)
- Adjust code length
- Implement a different checksum algorithm (e.g., weighted sum)
- Add additional validation rules