pipeline {
    agent any

    stages {
        stage('ncu') { 
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    sh 'ncu -e2'
                }
            }
        }
        stage('npm clean') { 
            steps {
                sh 'npm run clean' 
            }
        }
        stage('npm install') { 
            steps {
                sh 'npm install' 
            }
        }
        stage('npm run build') { 
            steps {
                sh 'npm run build'
                archiveArtifacts artifacts: 'dist/**/*.js'
            }
        }
    }
}