# Introduction

This is the project documentation, you can navigate through the different sections using the sidebar on the left. You will find information about the project, the different components, the installation process, and how to use the application.

# Project

The goal of the project is to create a photo sharing application that is end-to-end encrypted.

## Run the project

To run the project, you need to have Docker installed on your machine. You can run the following command to start the project:

```bash
cd docker/dev && docker-compose up
```

This will start the different services needed for the project. After that you need to start the application itself.

- [PnpM](https://pnpm.io/): is used as the package manager for the project.
- [Node.js](https://nodejs.org/): is used to run the application.

Both are required to run the application. To install node.js, we recommend using [NVM](https://github.com/nvm-sh/nvm) to manage the different versions of node.js. This will allow you to switch between different versions of node.js easily. By default it comes with npm installed. To install pnpm, you can run the following command:

```bash
npm i -g pnpm
```

After that you can run the following commands to start the application:

```bash
pnpm i # Install the dependencies

pnpm dev # Start the application
```

And now it's time to code 🚀🔥
