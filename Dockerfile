# Use a specific, stable Debian-based image
FROM python:3.10-bookworm

# Increase apt reliability for network flakiness in cloud build environments
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries

# Install system dependencies for OpenCV and PIL with extra resilience
RUN apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file first for better caching
COPY backend/requirements.txt ./backend/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the application
# We need the root level assets (best.pt and train/ folder)
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Set the working directory to the backend folder to run the server
WORKDIR /app/backend

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
