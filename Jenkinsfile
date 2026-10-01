pipeline {
    agent any

    stages {

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build React App') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t focusflow:jenkins .'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                        docker tag focusflow:jenkins "$DOCKER_USERNAME/focusflow:latest"
                        docker push "$DOCKER_USERNAME/focusflow:latest"
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'FocusFlow pipeline completed successfully.'
        }

        failure {
            echo 'FocusFlow pipeline failed. Check the console output.'
        }
    }
}