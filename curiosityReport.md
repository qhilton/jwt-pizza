# HAR File  Curiosity Report

## What is a HAR file?

A HAR file (HTTP Archive) is a record of JSON-formatted logs of network requests between a web browser and a website. HAR files capture all newtork requests and responses, including detailed inforamtion like the content of your cookies. Because of this they can contain sensitive/personal information and can be sanitized.

HAR files are mainly used for
* Debugging website performance issues and rendering problems
* Diagnosing network problems
* Understanding resource loading times
* Troubleshooting API requests

## HAR data structure
HAR files are required to be in UTF-8 encoding. The primary objects of a HAR file are
* content
* entries
* request
* response
* timings

But they also contain the following object types
* cache
* cookies
* creator
* browser
* headers
* log
* pages
* pageTimings
* params
* postData
* queryString

## HAR compression
HAR files may take up a lot of space, so you can compress them to store them more efficiently. The **.zhar** is a common extension for zipped HAR files. Note that most applications supporting HAR may not support the compressed version and has to be decompressed before using. 

## How to generate a HAR file
HAR files can be generated on most major browsers, like Chrome, Safari, Firefox, and Edge. Each browser has slightly different steps but most follow the same pattern. I will explain how to generate a HAR file in Chrome.

1. Open the troubled website in Chrome
2. Right click on the screen and click **Inspect** to open the dev tools
3. Click on the **Network** tab
4. Ensure the site is recording, look for a red circle in the top left
5. Check the **Preserve log** box
6. Navigate around the site to reproduce the error
7. Click the download arrow in the top left to export the HAR file
8. Download the **.har** to your computer

## Why are HAR files important to QA and DevOps
HAR files are important to QA and DevOps because they are a convenient way of debugging errors on a website. Because they are supported in all major browsers, they are can be used by almost everybody. HAR files make it simple to see the failing requests and other problems because they capture *everything*, step by step. They are simple to make and contain all required data for debugging, making them one of the most effective tools in QA and DevOps.