import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography variant="h3" color="error" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Sorry, the page you are looking for does not exist or an error occurred.
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary" sx={{ mt: 4 }}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
