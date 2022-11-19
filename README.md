# g4run - simple generic runner for Geant4 simulations

This program takes as input a GDML file,  a primary particle type and its
initial energy (position is always the origin), an optional a reference physics
list (default is `FTFP_BERT`), and runs an event loop in batch mode or an
interactive session. Its intented use is in profiling and benchmarking Geant4
performance.

# Installation
The g4run can be built on your system by either manually compiling geant4 or by using the Jenkins CI and CVMFS. 
To get started with the build , you need to first set up the CVMFS and mount Geant4 in it and get the bare clone of Geant4 to g4run. 

Please install the CVMFS on your machine reffering the [ CVMFS Installation Guide ](https://cvmfs.readthedocs.io/en/stable/cpt-quickstart.html). 
After installing it, you need to mount the Geant4 into the CVMFS
```
$ mount -t cvmfs geant4.cern.ch /cvmfs/geant4.cern.ch
$ cvmfs_config probe

Probing /cvmfs/geant4.cern.ch... OK
```
If you get the last line as the output then your geant4 was successfully mounted on your CVMFS. 
Go ahead into the `/g4run` directory and then create a `g4run/git` directory inside it. Now get the bare clone of Geant4 into this directory for allowing the Jenkins Scripts later to identify the head from this. 

Inside the `/g4run` directory
```
$ mkdir git
$ cd git
$ git clone --bare https://github.com/geant4/geant4.git
```
Next you need to take a look at the different versions available using the `$git tag` command into `git/geant4.git` and set the variables for the GIT_PREVIOUS_COMMIT and the GIT_COMMIT which will be pointing towards two different versions of Geant4. `env GIT_PREVIOUS_COMMIT=version1 GIT_COMMIT=version2 ci/jenkins.sh` where version1 and version2 are two git tags from the Geant4 git repository. 

Again into the `/g4run` directory
```
$ env GIT_PREVIOUS_COMMIT=v11.0.0 GIT_COMMIT=v11.0.2 ci/jenkins.sh
```

# Running the Tests
In order to make perf work as expected, You need to modify some of your kernel parameters.

```
$ sudo sysctl kernel.kptr_restrict=0
$ sudo sysctl kernel.perf_event_paranoid=-2
```
In order to run the tests, You need to install and build   [Pythia](https://pythia.org/) as instructed. After successfully installing Pythia you are all set to run the tests using the command 
```$ ctest```. 
In case if you need a detailed test logs then you can do it as verbose by running 
```$ ctest --VV```
and now you can run the reports with 
```$ ctest -R report```

### Visualizing the reports

You can already generate the perf reports by running the `ctest`. Further, Those perf reports are converted into the CSV data file with the help of scripts present in `g4run/perf/scripts` directory. For hierarchical data used for TreeMaps or Sunbursts, You can use the perf2treemap script.
``` 
$ ./perf2csv filename.perf
$ ./perf2treemap filename.perf
```
This will generate the CSV files. 

Make a new data directory inside `g4run/perf/g4Web` Generate those CSVs to the path `g4run/perf/g4Web/data` and now from the `/g4Web` directory run the HTTP server

`$ python -m http.server <port-number>`

And now you can visualize your data file into the dedicated tab into the g4Web. 
