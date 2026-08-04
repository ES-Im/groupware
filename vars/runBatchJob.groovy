import groovy.json.JsonOutput

def call(String jobName, List<String> jobParameters = []) {
    def cluster = 'groupware-cluster'
    def taskDef = 'groupware-batch-task'
    def containerName = 'app'
    def overrideFileName = "overrides-${jobName}-${env.BUILD_NUMBER}.json"

    def commandArgs = [
            '--spring.batch.job.enabled=true',
            "--spring.batch.job.name=${jobName}",
            '--spring.main.web-application-type=none'
    ] + jobParameters

    def overrides = [
            containerOverrides: [[
                 name: 'app',
                 command: commandArgs
            ]]
    ]

    writeFile(
            file: overrideFileName,
            text: JsonOutput.toJson(overrides)
    )

    def taskArn = sh(
            script: """
            aws ecs run-task \
              --cluster ${cluster} \
              --task-definition ${taskDef} \
              --launch-type FARGATE \
              --network-configuration \
                "awsvpcConfiguration={subnets=[${env.SUBNETS}],securityGroups=[${env.SG}],assignPublicIp=DISABLED}" \
              --overrides file://${overrideFileName} \
              --query 'tasks[0].taskArn' \
              --output text
        """,
            returnStdout: true
    ).trim()

    if (!taskArn || taskArn == 'None') {
        error("run-task 미기동: ${jobName}")
    }

    sh """
        aws ecs wait tasks-stopped \
          --cluster ${cluster} \
          --tasks ${taskArn}
    """

    def exitCode = sh(
            script: """
            aws ecs describe-tasks \
              --cluster ${cluster} \
              --tasks ${taskArn} \
              --query "tasks[0].containers[?name=='${containerName}'].exitCode | [0]" \
              --output text
        """,
            returnStdout: true
    ).trim()

    if (exitCode != '0') {
        error("배치 실패: ${jobName}, exitCode=${exitCode}")
    }

    echo "배치 성공: ${jobName}"
}