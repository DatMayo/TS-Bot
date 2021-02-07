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
        stage('npm install') { 
            steps {
                sh 'npm install' 
            }
        }
        stage('npm lint') { 
            steps {
                sh 'npm run lint' 
            }
        }
        stage('npm run build') { 
            steps {
                sh 'npm run build'
                archiveArtifacts artifacts: 'build/**/*.js'
            }
        }
    }
}