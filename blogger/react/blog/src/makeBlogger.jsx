import { NavLink } from 'react-router';

export default function MakeBlogger(props) {
    const blogger = props.blogger;
    return (
        <>
            <div className='maincontainer'>
                <div className='border'>
                    <div className='thecard'>
                        <div className='front'>
                            <h3 className='name'>Hi, my name is {blogger.name}</h3>
                            <h4 className='work'>I work for {blogger.company.name} and my job is to <br />{blogger.company.bs}</h4>
                        </div>
                        <div className='back'>
                            <div className='bioContainer'>
                                <p className='bio'>I love sharing ideas and stories.
                                    Check out my blog and connect with me!
                                </p>
                                <NavLink to={`/${blogger.id}`} >
                                    <div className='webTextContainer' >
                                        <p className='webText'>Check out my Blog: <span className='websiteLink'>{blogger.website}</span></p>
                                    </div>
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}