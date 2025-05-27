# Portfolio Bundles API

## POST `/api/bundles`
**Create a new portfolio bundle**

### Request Body (application/json)
```json
{
  "name": "Starter Pack",
  "description": "Best portfolios for new investors",
  "portfolios": [
    "615a2d4b87d9c34f7d4f8a12",
    "615a2d4b87d9c34f7d4f8a13"
  ],
  "discountPercentage": 20
}
```

### Responses
- **201**: Bundle created successfully  
  Media type: `application/json`

---

## GET `/api/bundles`
**Get all bundles**

### Responses
- **200**: List of all bundles  
  Media type: `application/json`  
  Example:
  ```json
  [
    "string"
  ]
  ```

---

## PUT `/api/bundles/{id}`
**Update a bundle**

### Parameters
- **id** (path, required): `string` – Bundle ID

### Request Body (application/json)
```json
{
  "name": "Updated Starter Pack",
  "discountPercentage": 25
}
```

### Responses
- **200**: Bundle updated successfully
- **404**: Bundle not found

---

## GET `/api/bundles/{id}`
**Get bundle by ID**

### Parameters
- **id** (path, required): `string` – Bundle ID

### Responses
- **200**: Bundle details  
  Media type: `application/json`  
  Example:
  ```json
  "string"
  ```
- **404**: Bundle not found

---

## DELETE `/api/bundles/{id}`
**Delete a bundle**

### Parameters
- **id** (path, required): `string` – Bundle ID

### Responses
- **200**: Bundle deleted successfully
- **404**: Bundle not found
