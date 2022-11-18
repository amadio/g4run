# g4run - simple generic runner for Geant4 simulations

This program takes as input a GDML file,  a primary particle type and its
initial energy (position is always the origin), an optional a reference physics
list (default is `FTFP_BERT`), and runs an event loop in batch mode or an
interactive session. Its intented use is in profiling and benchmarking Geant4
performance.

# Installation

In order to get the g4run on your system, You should compile Geant4 first. For detailed instructions on building and installing Geant4, including all supported platforms and configuration options, please refer to the [Geant4 Installation Guide](http://cern.ch/geant4-userdoc/UsersGuides/InstallationGuide/html).

Before getting started with the actual installation you need to have some libraries and packages.
Use appropriate package manager to get `libxerces-c-dev` and `git-lfs`.

While installing the Geant4 there are some flags which needs to be modified as per g4run. 

In the build directory : 
`/path/to/geant4-v-xx.x.x-build ` you can modify your cmake as per 

``` 
$ cmake . -DGEANT4_USE_GDML=ON -DCMAKE_CXX_FLAGS="-O2 
          -DNDEBUG -march=native -fno-omit-frame-pointer -g" 
          -DCMAKE_INSTALL_RPATH='$ORIGIN' 
$ make
$ make install
```

Now, Inside your `/path/to/g4run` you need to run 
```
$ cmake . -DCMAKE_PREFIX_PATH=/path/to/geant4-v-xx.x.x-install
$ make 
$ make install
$ git-lfs pull
$ export LD_LIBRARY_PATH=/path/to/geant4-v-xx.x.x-install/lib
```

In order to make perf work as expected, You need to modify some of your kernel parameters.

```
$ sudo sysctl kernel.kptr_restrict=0
$ sudo sysctl kernel.perf_event_paranoid=-2
```
# Running the Tests
You are all set to run the tests using the command 
```$ ctest```. 
In case if you need a detailed test logs then you can do it as verbose by running 
```$ ctest --VV```
You can also run your report for some specific particle types rather than running all the reports. For Example , You need to have the test reports for the gamma particles. then you can run 
```$ ctest -R gamma```

In order to see what all different particles you can get, please refer `g4run/perf/CMakeLists.txt`. Here if you are running without Pythia (We will see this later) then available primary particles are provided in [PRIMARIES]( https://github.com/amadio/g4run/blob/028ed21f094b668a1b88aa92e9cc08f07fccec18/perf/CMakeLists.txt#L43)

#### **Running tests with Pythia**
In order to run the tests with the [Pythia](https://pythia.org/), You need to build and install it as instructed. After successfully installing Pythia you need to add 
```
$ export PYTHIA8PATH = ~/path/to/pythia
$ export PYTHIA8DATA = $PYTHIA8PATH/share/Pythia8/xmldoc
$ export LD_LIBRARY_PATH = $PYTHIA8PATH/lib:$LD_LIBRARY_PATH
```

If the directory of your installation of Pythia is same as Geant4 installation directory then you don't need to put extra efforts to configure the path. But if both are on separate paths then go again to `/path/to/g4run` and run configure the Pythia Installation path
```
$ cmake . -DCMAKE_PREFIX_PATH=/path/to/pythia-install
$ make
$ make install
```
and now you can run the reports with ```$ ctest -R report```

### Visualizing the reports

You can already generate the perf reports by running the `ctest`. Further, Those reports are converted into the CSV data file with the help of scripts present in `g4run/perf/scripts` directory. Make a new data directory inside `g4run/perf/g4Web` Generate those CSVs to the path `g4run/perf/g4Web/data` and now from the `/g4Web` directory run the HTTP server

`$ python -m http.server <port-number>`

And now you can visualize your data file into the dedicated tab into the g4Web. 