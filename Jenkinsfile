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